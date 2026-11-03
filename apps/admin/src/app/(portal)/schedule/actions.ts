"use server";

import { requireAdmin } from "@/lib/auth";
import { schedulingCrew } from "@/lib/schedule-data";
import { parseCentral, statuses, validDay } from "@/lib/scheduling";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type ScheduleState = { error?: string; message?: string; values?: Record<string,string>; staff?: string[] };
const text = (form: FormData, key: string) => String(form.get(key) ?? "").trim();
const uuid = (value: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
function refresh(jobId: string) { revalidatePath("/schedule"); revalidatePath(`/schedule/jobs/${jobId}`); }

export async function saveJob(_state: ScheduleState, form: FormData): Promise<ScheduleState> {
  const { supabase } = await requireAdmin();
  const id = text(form, "id");
  if (id && !uuid(id)) return { error: "Invalid job. Reload and try again." };
  const job = {
    title: text(form,"title"), customer_name: text(form,"customer_name"), customer_email: text(form,"customer_email"),
    customer_phone: text(form,"customer_phone"), equipment: text(form,"equipment"), location: text(form,"location"),
    instructions: text(form,"instructions"), status: text(form,"status"), blocker: text(form,"blocker"),
    priority: text(form,"priority"), due_date: text(form,"due_date") || null, updated_at: new Date().toISOString(),
  };
  if (!job.title || !job.customer_name || job.title.length>160 || job.customer_name.length>160) return { error: "Enter a job title and customer name, each 160 characters or fewer." };
  if (!(job.status in statuses) || !["normal","urgent"].includes(job.priority)) return { error: "Choose a valid status and priority." };
  if (job.customer_email.length>254 || (job.customer_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(job.customer_email))) return { error: "Enter a valid customer email or leave it blank." };
  if (job.customer_phone.length>40 || job.equipment.length>500 || job.location.length>500 || job.instructions.length>5000 || job.blocker.length>300) return { error: "One of the job details is too long." };
  if (job.due_date && !validDay(job.due_date)) return { error: "Enter a valid due date." };
  if (id && job.status==="completed") {
    const {count,error}=await supabase.from("bookings").select("id",{count:"exact",head:true}).eq("job_id",id).eq("status","scheduled");
    if(error) return {error:"Unable to check remaining bookings. Try again."};
    if(count) return {error:"Complete or cancel the remaining scheduled bookings before completing this job."};
  }
  const result = id ? await supabase.from("jobs").update(job).eq("id",id).select("id").single() : await supabase.from("jobs").insert(job).select("id").single();
  if (result.error || !result.data) return { error: "The job could not be saved. Reload and try again." };
  refresh(result.data.id);
  if (!id) redirect(`/schedule/jobs/${result.data.id}`);
  return { message: "Job saved." };
}

export async function saveBooking(_state: ScheduleState, form: FormData): Promise<ScheduleState> {
  const { supabase } = await requireAdmin();
  const id = text(form,"id"); const jobId = text(form,"job_id"); const kind = text(form,"kind");
  const crew = [...new Set(form.getAll("staff").map(String))]; const lead = text(form,"lead");
  const fail = (error:string):ScheduleState => ({error, values:Object.fromEntries([...form.entries()].filter((entry):entry is [string,string]=>typeof entry[1]==="string")), staff:crew});
  if (!uuid(jobId) || (id && !uuid(id)) || !["shop","field"].includes(kind)) return fail("Choose a valid job and booking type.");
  if (!crew.length || !crew.includes(lead)) return fail("Choose at least one assigned person and select a lead from that crew.");
  const eligible = new Set((await schedulingCrew()).map(person=>person.id));
  if (crew.some(person=>!eligible.has(person))) return fail("An assigned person no longer has staff access. Reload the page.");
  const location = text(form,"location"), instructions = text(form,"instructions");
  if (location.length>500 || instructions.length>2000) return fail("Location or booking instructions are too long.");
  let start: string | null=null, end: string | null=null, day: string | null=null, lastDay: string | null=null;
  if (kind==="field") {
    try { start=parseCentral(text(form,"start_at")); end=parseCentral(text(form,"end_at")); }
    catch(error) { return fail(error instanceof Error ? error.message : "Enter valid booking times."); }
    if (end<=start) return fail("End time must be after start time.");
  } else {
    day=text(form,"start_day"); lastDay=text(form,"end_day");
    if (!validDay(day) || !validDay(lastDay) || lastDay<day) return fail("Enter a valid first and last shop day.");
  }
  const { data: job } = await supabase.from("jobs").select("status").eq("id",jobId).single();
  if (!job || job.status==="completed") return fail("Reopen this job before scheduling more work.");
  const { error } = await supabase.rpc("save_booking", {
    p_id: id || null, p_job: jobId, p_kind: kind, p_start: start, p_end: end,
    p_day: day, p_last_day: lastDay, p_staff: crew, p_lead: lead,
    p_location: location, p_instructions: instructions, p_override: form.get("override")==="on",
  });
  if (error) return fail(error.message.startsWith("Crew overlap:") ? error.message : "The booking could not be saved. It may have changed; reload and try again.");
  refresh(jobId);
  return { message: id ? "Booking updated." : "Booking added." };
}

export async function finishBooking(_state: ScheduleState, form: FormData): Promise<ScheduleState> {
  const { supabase } = await requireAdmin();
  const id=text(form,"id"), job=text(form,"job_id"), status=text(form,"status");
  if (!uuid(id) || !uuid(job) || !["completed","cancelled"].includes(status)) return { error: "Invalid booking update." };
  const result=await supabase.from("bookings").update({status,updated_at:new Date().toISOString()}).eq("id",id).eq("job_id",job).eq("status","scheduled").select("id").single();
  if(result.error) return {error:"This booking has changed. Reload and try again."};
  refresh(job); return {message: status==="completed" ? "Visit completed. The overall job status is unchanged." : "Booking cancelled."};
}
