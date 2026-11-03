import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { centralToday, shiftDay, weekStart, bookingDays, bookingLabel, parseCentral, statuses } from "@/lib/scheduling";
import { JobForm } from "./forms";
import { schedulingCrew } from "@/lib/schedule-data";

export default async function SchedulePage({searchParams}:{searchParams:Promise<{week?:string;view?:string}>}) {
  const {supabase,user}=await requireStaff();
  const params=await searchParams; const monday=weekStart(params.week??centralToday());
  const sunday=shiftDay(monday,6); const next=shiftDay(monday,7); const isAdmin=user.app_metadata.role==="admin";
  const [jobResult,bookingResult]=await Promise.all([
    supabase.from("jobs").select("*").order("updated_at",{ascending:false}).limit(200),
    supabase.from("bookings").select("*, jobs(title,job_number,priority)").neq("status","cancelled")
      .or(`and(kind.eq.field,start_at.lt.${parseCentral(next+"T00:00")},end_at.gt.${parseCentral(monday+"T00:00")}),and(kind.eq.shop,start_day.lte.${sunday},end_day.gte.${monday})`)
      .order("created_at").limit(1000),
  ]);
  if(jobResult.error || bookingResult.error) throw new Error("Unable to load the schedule. Please try again.");
  const jobs=jobResult.data; const bookings=bookingResult.data; const board=params.view==="board"; const jobsView=params.view==="jobs";
  const [crew, assignments]=await Promise.all([
    isAdmin?schedulingCrew():Promise.resolve([]),
    isAdmin&&bookings.length?supabase.from("booking_assignments").select("booking_id,staff_id").in("booking_id",bookings.map(b=>b.id)):Promise.resolve({data:[],error:null}),
  ]);
  if(assignments.error) throw new Error("Unable to load crew assignments.");
  return <section className="min-w-0">
    <div className="mx-auto max-w-[1500px]">

      <header className="flex flex-wrap items-end justify-between gap-5"><div><h1 className="text-3xl font-semibold">{jobsView?"Jobs":board?"Shop board":isAdmin?"Shop & crew schedule":"My assigned work"}</h1><p className="mt-3 text-sm text-[#6a5b50]">All times are Central Time. Shop days are flexible; field visits have appointment times.</p></div>
      <nav className="flex flex-wrap gap-3 text-sm" aria-label="Schedule views"><Link href={`/schedule?week=${monday}`} className={`rounded-md border px-4 py-2 ${!board&&!jobsView?"bg-[#17130f] text-white":"border-[#2a2119]/25"}`}>Week calendar</Link><Link href={`/schedule?view=board&week=${monday}`} className={`rounded-md border px-4 py-2 ${board?"bg-[#17130f] text-white":"border-[#2a2119]/25"}`}>Shop board</Link></nav></header>
      {isAdmin && <details className="mt-7 rounded-lg border border-[#2a2119]/20 bg-[#fffaf0] p-5"><summary className="cursor-pointer font-semibold">Create a job</summary><JobForm/></details>}
      {!board && !jobsView ? <section className="mt-8" aria-labelledby="week-title">
        <div className="flex flex-wrap items-center justify-between gap-4"><h2 id="week-title" className="text-lg font-semibold">{monday} – {sunday}</h2><nav aria-label="Calendar weeks" className="flex gap-5 text-sm underline underline-offset-4"><Link href={`/schedule?week=${shiftDay(monday,-7)}`}>Previous week</Link><Link href="/schedule">This week</Link><Link href={`/schedule?week=${next}`}>Next week</Link></nav></div>
        <div className="mt-4 overflow-x-auto pb-3"><div className="grid min-w-[1050px] grid-cols-7 gap-3">{Array.from({length:7},(_,i)=>shiftDay(monday,i)).map(day=>{
          const items=bookings.filter(booking=>{const [first,last]=bookingDays(booking);return first<=day && last>=day;});
          return <section key={day} className={`min-h-48 rounded-lg border bg-[#fffaf0] p-3 ${day===centralToday()?"border-[#8f3f21]":"border-[#2a2119]/15"}`} aria-label={day}>
            <h3 className="border-b border-[#2a2119]/15 pb-3 text-sm font-semibold">{new Intl.DateTimeFormat("en-US",{weekday:"short",month:"short",day:"numeric",timeZone:"UTC"}).format(new Date(day+"T12:00:00Z"))}{day===centralToday()?" · Today":""}</h3>
            <div className="mt-3 grid gap-3">{items.map(booking=><Link key={booking.id} href={`/schedule/jobs/${booking.job_id}`} className={`block rounded-md border-l-4 bg-[#f4efe5] p-3 text-sm focus-visible:outline-2 ${booking.jobs?.priority==="urgent"?"border-[#a43c26]":"border-[#9e6d38]"}`}><span className="text-xs text-[#6a5b50]">#{booking.jobs?.job_number} · {booking.status==="completed"?"Visit done":booking.kind==="shop"?"Shop":"Field"}</span><strong className="mt-1 block break-words">{booking.jobs?.title??"Job"}</strong><span className="mt-2 block text-xs leading-5">{bookingLabel(booking)}</span>{isAdmin&&<span className="mt-2 block text-xs font-medium">{crew.filter(person=>(assignments.data??[]).some(a=>a.booking_id===booking.id&&a.staff_id===person.id)).map(person=>person.name).join(", ")||"Assigned crew"}</span>}{booking.location&&<span className="mt-2 block break-words text-xs">{booking.location}</span>}</Link>)}{!items.length&&<p className="py-4 text-sm text-[#6a5b50]">No bookings</p>}</div>
          </section>;
        })}</div></div>
        {bookings.length===1000&&<p role="alert">Only the first 1,000 bookings are shown.</p>}
      </section> : board ? <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4" aria-label="Shop board">{Object.entries(statuses).map(([value,label])=><section key={value} className="rounded-lg border border-[#2a2119]/15 bg-[#fffaf0] p-4"><h2 className="font-semibold">{label} <span className="text-[#6a5b50]">({jobs.filter(job=>job.status===value).length})</span></h2><div className="mt-4 grid gap-3">{jobs.filter(job=>job.status===value).map(job=><JobCard key={job.id} job={job}/>)}</div></section>)}</section> : null}
      <section className="mt-8" aria-labelledby="jobs-heading"><h2 id="jobs-heading" className="text-xl font-semibold">{isAdmin?"Job list":"Assigned jobs"}</h2><p className="mt-2 text-sm text-[#6a5b50]">Up to 200 most recently updated jobs. New and ready jobs can stay here until a booking is made.</p><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{jobs.map(job=><JobCard key={job.id} job={job}/>)}</div>{!jobs.length&&<p className="mt-4 rounded-lg border border-dashed border-[#2a2119]/30 p-8 text-[#6a5b50]">{isAdmin?"No jobs yet. Create a job above, then add its shop days or field visits.":"No jobs are assigned to you yet."}</p>}</section>
    </div>
  </section>;
}

function JobCard({job}:{job:{id:string;job_number:number;title:string;customer_name:string;status:string;priority:string;blocker:string;due_date:string|null}}) {
  return <Link href={`/schedule/jobs/${job.id}`} className="block rounded-md border border-[#2a2119]/15 bg-[#fffaf0] p-4 focus-visible:outline-2 focus-visible:outline-offset-2"><span className="text-xs text-[#6a5b50]">#{job.job_number} · {statuses[job.status as keyof typeof statuses]}{job.priority==="urgent"?" · URGENT":""}</span><strong className="mt-2 block">{job.title}</strong><span className="mt-1 block text-sm">{job.customer_name}</span>{job.due_date&&<span className="mt-2 block text-xs">Due {job.due_date}</span>}{job.blocker&&<span className="mt-2 block rounded bg-[#a46c23]/10 p-2 text-xs">Waiting on: {job.blocker}</span>}</Link>;
}
