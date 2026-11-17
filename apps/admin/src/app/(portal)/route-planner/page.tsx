import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { routingConfigured } from "@/lib/google-routing";
import { routeVisits } from "@/lib/route-visits";
import { schedulingCrew } from "@/lib/schedule-data";
import { centralInput, centralToday, shiftDay, validDay, weekStart } from "@/lib/scheduling";
import { Planner } from "./planner";

const dateLabel = new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" });
const formatDay = (day: string) => dateLabel.format(new Date(day + "T12:00:00Z"));

export default async function RoutePlannerPage({ searchParams }: {
  searchParams: Promise<{ day?: string; lead?: string }>;
}) {
  const { user } = await requireStaff();
  const params = await searchParams;
  const day = params.day && validDay(params.day) ? params.day : centralToday();
  const monday = weekStart(day);
  const isAdmin = user.app_metadata.role === "admin";
  const [week, crew] = await Promise.all([
    routeVisits(monday, 7),
    isAdmin ? schedulingCrew() : Promise.resolve([]),
  ]);
  const options = [...crew];
  for (const id of new Set(week.map(visit => visit.leadId))) {
    if (!options.some(person => person.id === id)) options.push({ id, name: "Former or unavailable crew lead" });
  }
  const lead = isAdmin
    ? options.find(person => person.id === params.lead)?.id ?? week[0]?.leadId ?? user.id
    : user.id;
  const crewWeek = week.filter(visit => visit.leadId === lead);
  const selected = crewWeek.filter(visit => centralInput(visit.start).startsWith(day));
  const href = (date: string) => `/route-planner?day=${date}&lead=${lead}`;

  return <section className="mx-auto max-w-[1400px]">
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="portal-eyebrow">Field dispatch</p>
        <h1 className="text-3xl font-semibold">Route planner</h1>
        <p className="mt-2 text-sm text-[#6a5b50]">Review the week, then map a day of scheduled field visits for one crew.</p>
      </div>
      <Link href={`/schedule?week=${monday}`} className="text-sm underline underline-offset-4">Open schedule</Link>
    </header>

    <div className="portal-panel mt-6 p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="font-semibold">{formatDay(monday)} – {formatDay(shiftDay(monday, 6))}</h2>
        <nav aria-label="Route weeks" className="flex flex-wrap gap-4 text-sm underline underline-offset-4">
          <Link href={href(shiftDay(day, -7))}>Previous week</Link>
          <Link href={href(centralToday())}>Today</Link>
          <Link href={href(shiftDay(day, 7))}>Next week</Link>
        </nav>
      </div>
      <nav aria-label="Route days" className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-7">
        {Array.from({ length: 7 }, (_, index) => shiftDay(monday, index)).map(date => {
          const count = crewWeek.filter(visit => centralInput(visit.start).startsWith(date)).length;
          return <Link key={date} href={href(date)} aria-current={day === date ? "date" : undefined}
            className={`rounded-md border px-3 py-2 text-sm ${day === date ? "border-[#17130f] bg-[#17130f] text-white" : "border-[#2a2119]/20"}`}>
            <span className="block font-semibold">{formatDay(date)}</span>
            <span className="block text-xs opacity-80">{count} {count === 1 ? "visit" : "visits"}</span>
          </Link>;
        })}
      </nav>
    </div>

    <div className="mt-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-xl font-semibold">{formatDay(day)}</h2>
        <p className="text-sm text-[#6a5b50]">{selected.length} scheduled field {selected.length === 1 ? "visit" : "visits"} · Central Time</p>
      </div>
      {isAdmin && <form action="/route-planner" className="flex flex-wrap items-end gap-2">
        <input type="hidden" name="day" value={day} />
        <label className="grid gap-1 text-sm font-medium">Crew lead
          <select key={lead} name="lead" defaultValue={lead} className="max-w-full rounded-md border border-[#2a2119]/25 bg-white px-3 py-2">
            {options.map(person => <option key={person.id} value={person.id}>{person.name}</option>)}
          </select>
        </label>
        <button className="rounded-md border border-[#2a2119]/25 px-3 py-2 text-sm font-semibold">Show crew</button>
      </form>}
    </div>

    <Planner key={`${day}:${lead}`} day={day} lead={lead} visits={selected}
      configured={routingConfigured()} depot={process.env.WARREN_ROUTE_DEPOT_ADDRESS ?? ""} />
  </section>;
}
