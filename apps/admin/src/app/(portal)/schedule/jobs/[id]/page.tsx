import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/auth";
import { schedulingCrew } from "@/lib/schedule-data";
import { bookingLabel, statuses } from "@/lib/scheduling";
import { JobForm, BookingForm, BookingStatusForm } from "../../forms";

export default async function JobPage({params}:{params:Promise<{id:string}>}) {
  const {supabase,user}=await requireStaff();const {id}=await params;
  if(!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const admin=user.app_metadata.role==="admin";
  const [jobResult,bookingResult,crew]=await Promise.all([
    supabase.from("jobs").select("*").eq("id",id).maybeSingle(),
    supabase.from("bookings").select("*").eq("job_id",id).order("created_at",{ascending:false}).limit(100),
    admin?schedulingCrew():Promise.resolve([]),
  ]);
  const assignmentResult=admin&&bookingResult.data?.length?await supabase.from("booking_assignments").select("booking_id,staff_id").in("booking_id",bookingResult.data.map(booking=>booking.id)): {data:[],error:null};
  if(jobResult.error||bookingResult.error||assignmentResult.error)throw new Error("Unable to load this job.");
  const job=jobResult.data;if(!job)notFound();
  const assignments=assignmentResult.data??[];
  return <section className="min-w-0"><div className="mx-auto max-w-5xl">
    <Link href="/schedule" className="text-sm underline underline-offset-4">Back to schedule</Link>
    <p className="mt-8 font-mono text-xs uppercase tracking-[0.2em] text-[#8f3f21]">Job #{job.job_number} · {statuses[job.status as keyof typeof statuses]}{job.priority==="urgent"?" · Urgent":""}</p><h1 className="mt-3 text-3xl font-semibold">{job.title}</h1>
    <section className="mt-6 grid gap-4 rounded-lg border border-[#2a2119]/15 bg-[#fffaf0] p-5 sm:grid-cols-2" aria-label="Job details">
      <div><h2 className="font-semibold">{job.customer_name}</h2>{job.customer_phone&&<p className="mt-2 text-sm">Phone: {job.customer_phone}</p>}{job.customer_email&&<p className="mt-2 break-all text-sm">{job.customer_email}</p>}{job.location&&<p className="mt-2 text-sm">{job.location}</p>}</div>
      <div>{job.equipment&&<p className="text-sm">Equipment: {job.equipment}</p>}{job.due_date&&<p className="mt-2 text-sm">Requested due: {job.due_date}</p>}{job.blocker&&<p className="mt-2 rounded bg-amber-700/10 p-2 text-sm">Waiting on: {job.blocker}</p>}</div>
      {job.instructions&&<p className="whitespace-pre-wrap text-sm leading-6 sm:col-span-2">{job.instructions}</p>}
    </section>
    {admin&&<details className="mt-6 rounded-lg border border-[#2a2119]/15 bg-[#fffaf0] p-5"><summary className="cursor-pointer font-semibold">Edit job details &amp; progress</summary><JobForm job={job}/></details>}
    {admin&&job.status!=="completed"&&<details className="mt-6 rounded-lg border border-[#2a2119]/15 bg-[#fffaf0] p-5"><summary className="cursor-pointer font-semibold">Add a booking</summary><BookingForm job={job} crew={crew}/></details>}
    <section className="mt-8" aria-labelledby="bookings"><h2 id="bookings" className="text-xl font-semibold">Shop days &amp; field visits</h2><p className="mt-2 text-sm text-[#6a5b50]">Central Time. Completing a visit does not close the overall job.</p>
      <div className="mt-4 grid gap-4">{bookingResult.data.map(booking=><article key={booking.id} className="rounded-lg border border-[#2a2119]/15 bg-[#fffaf0] p-5"><h3 className="font-semibold">{bookingLabel(booking)}</h3><p className="mt-2 text-sm capitalize">{booking.status}</p>{admin&&<p className="mt-2 text-sm">Crew: {crew.filter(person=>assignments.some(a=>a.booking_id===booking.id&&a.staff_id===person.id)).map(person=>person.name+(person.id===booking.lead_id?" (lead)":"")).join(", ")||"Previously assigned staff"}</p>}{booking.location&&<p className="mt-2 text-sm">{booking.location}</p>}{booking.instructions&&<p className="mt-3 whitespace-pre-wrap text-sm">{booking.instructions}</p>}{admin&&booking.status==="scheduled"&&<><details className="mt-4"><summary className="cursor-pointer text-sm underline underline-offset-4">Reschedule / change crew</summary><BookingForm job={job} crew={crew} booking={booking} assigned={assignments.filter(a=>a.booking_id===booking.id).map(a=>a.staff_id)}/></details><BookingStatusForm booking={booking}/></>}</article>)}</div>
      {!bookingResult.data.length&&<p className="mt-4 rounded-lg border border-dashed border-[#2a2119]/25 p-6 text-sm">No bookings yet. This job remains on the shop board.</p>}
    </section>
  </div></section>;
}
