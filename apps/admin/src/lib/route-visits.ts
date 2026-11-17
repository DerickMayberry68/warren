import "server-only";
import { requireStaff } from "./auth";
import { parseCentral, shiftDay } from "./scheduling";

export async function routeVisits(day: string, days: number, lead?: string) {
  const { supabase, user } = await requireStaff();
  let query = supabase.from("bookings")
    .select("id, job_id, location, start_at, end_at, lead_id, jobs(title, job_number, location)")
    .eq("kind", "field").eq("status", "scheduled")
    .gte("start_at", parseCentral(day + "T00:00"))
    .lt("start_at", parseCentral(shiftDay(day, days) + "T00:00"));
  if (user.app_metadata.role !== "admin") query = query.eq("lead_id", user.id);
  else if (lead) query = query.eq("lead_id", lead);

  const { data, error } = await query.order("start_at").limit(501);
  if (error || !data || data.length > 500) throw new Error("Unable to load the scheduled visits.");
  return data.flatMap(visit => {
    if (!visit.start_at || !visit.end_at || !visit.jobs) return [];
    return [{
      id: visit.id,
      jobId: visit.job_id,
      leadId: visit.lead_id,
      title: visit.jobs.title,
      number: visit.jobs.job_number,
      address: visit.location?.trim() || visit.jobs.location?.trim() || "",
      start: visit.start_at,
      end: visit.end_at,
    }];
  });
}

export type RouteVisit = Awaited<ReturnType<typeof routeVisits>>[number];
