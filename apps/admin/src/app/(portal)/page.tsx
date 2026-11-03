import Link from "next/link";
import { CalendarDays, ClipboardList, Mail, ArrowUpRight, CirclePause } from "lucide-react";
import { requireStaff } from "@/lib/auth";
import { ContactRequests } from "@/components/contact-requests";

export default async function DashboardPage() {
  const {supabase,user}=await requireStaff();
  const [contacts,jobs,waiting]=await Promise.all([
    supabase.from("contacts").select("id",{count:"exact",head:true}).eq("status","new"),
    supabase.from("jobs").select("id",{count:"exact",head:true}).neq("status","completed"),
    supabase.from("jobs").select("id",{count:"exact",head:true}).eq("status","waiting"),
  ]);
  const metrics=[
    {label:"New requests",value:contacts.error?"—":contacts.count??0,href:"/leads",action:"View requests",icon:Mail},
    {label:"Active jobs",value:jobs.error?"—":jobs.count??0,href:"/schedule?view=jobs",action:"View jobs",icon:ClipboardList},
    {label:"Waiting on something",value:waiting.error?"—":waiting.count??0,href:"/schedule?view=board",action:"Open shop board",icon:CirclePause},
  ];
  return <section>
    <div className="portal-page-heading"><div><h1>Workspace overview</h1><p>{user.app_metadata.role==="admin"?"Keep an eye on incoming requests, work in the shop, and the crew schedule.":"Your assigned work and the latest customer requests."}</p></div><Link href="/schedule" className="inline-flex items-center gap-2 rounded-md bg-[#17130f] px-4 py-3 text-sm font-semibold text-[#f7f0e2]"><CalendarDays size={17}/>Open schedule</Link></div>
    <div className="grid gap-5 md:grid-cols-3">{metrics.map(metric=><div key={metric.label} className="portal-panel p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-sm text-[#6a5b50]">{metric.label}</p><p className="mt-3 text-3xl font-semibold">{metric.value}</p></div><span className="rounded-md bg-[#d9762a]/10 p-3 text-[#8f3f21]"><metric.icon size={20}/></span></div><Link href={metric.href} className="mt-5 inline-flex items-center gap-2 text-xs font-semibold text-[#8f3f21]">{metric.action}<ArrowUpRight size={14}/></Link></div>)}</div>
    <div className="mt-9 flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-semibold">Recent contact requests</h2><Link href="/leads" className="text-sm text-[#8f3f21] underline underline-offset-4">View all requests</Link></div>
    <div className="mt-4"><ContactRequests limit={5}/></div>
    {(jobs.error||waiting.error||contacts.error)&&<p role="alert" className="mt-4 text-sm text-[#8f3f21]">Some overview counts could not be loaded. Open the relevant section or reload to try again.</p>}
  </section>;
}
