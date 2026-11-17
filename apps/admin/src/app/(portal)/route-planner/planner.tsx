"use client";

import Link from "next/link";
import { MapPinned, Route } from "lucide-react";
import { useActionState, useCallback, useEffect, useRef, useState, useTransition } from "react";
import type { RouteVisit } from "@/lib/route-visits";
import { centralToday, zone } from "@/lib/scheduling";
import { planRoute, zoomRouteMap } from "./actions";
import type { RouteMapData } from "@/lib/google-routing";
import { fitRoute, shiftViewport, MAP_WIDTH, MAP_HEIGHT, type MapViewport } from "@/lib/route-viewport";

const input = "w-full min-w-0 rounded-md border border-[#2a2119]/25 bg-white px-3 py-2.5";
const clock = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone: zone });
const time = (value: string) => clock.format(new Date(value));

function VisitLink({ visit }: { visit: RouteVisit }) {
  if (!visit.jobId) return <strong>{visit.title}</strong>;
  return <Link href={`/schedule/jobs/${visit.jobId}`} className="font-semibold underline underline-offset-4">
    #{visit.number} {visit.title}
  </Link>;
}

function RouteMap({ image, data }: { image: string; data: RouteMapData }) {
  const [initial] = useState(() => fitRoute(data));
  const [detail, setDetail] = useState<{ image: string; view: MapViewport }>();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState(false);
  const viewport = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number; id: number } | null>(null);
  const busy = useRef(false);
  const view = detail?.view ?? initial;
  const control = "rounded-md border border-[#2a2119]/25 px-3 py-2 font-semibold disabled:opacity-40";

  const move = useCallback((target: MapViewport) => {
    if (busy.current) return;
    busy.current = true;
    setError(false);
    startTransition(async () => {
      try {
        const result = await zoomRouteMap(data, target.center, target.zoom);
        if (result) setDetail({ image: result, view: target });
        else setError(true);
      } catch {
        setError(true);
      } finally {
        busy.current = false;
      }
    });
  }, [data]);

  const zoom = useCallback((step: number, x = 0, y = 0) => {
    const level = Math.max(0, Math.min(19, view.zoom + step));
    if (level !== view.zoom) move(shiftViewport(view, level, x, y));
  }, [move, view]);

  useEffect(() => {
    const element = viewport.current;
    if (!element) return;
    function onWheel(event: WheelEvent) {
      if (event.ctrlKey || !event.deltaY || !element) return;
      event.preventDefault();
      const rect = element.getBoundingClientRect();
      zoom(Math.sign(-event.deltaY),
        ((event.clientX - rect.left) / rect.width - 0.5) * MAP_WIDTH,
        ((event.clientY - rect.top) / rect.height - 0.5) * MAP_HEIGHT);
    }
    element.addEventListener("wheel", onWheel, { passive: false });
    return () => element.removeEventListener("wheel", onWheel);
  }, [zoom]);

  return <div>
    <fieldset disabled={pending} className="flex flex-wrap items-center gap-2 border-b border-[#2a2119]/15 p-3 text-sm">
      <button type="button" aria-label="Zoom out" className={control} disabled={view.zoom === 0} onClick={() => zoom(-1)}>−</button>
      <button type="button" aria-label="Zoom in" className={control} disabled={view.zoom === 19} onClick={() => zoom(1)}>+</button>
      <button type="button" className={control} disabled={!detail} onClick={() => { setDetail(undefined); setError(false); }}>Fit route</button>
      <span className="text-[#6a5b50]">Scroll to zoom. Drag to pan.</span>
    </fieldset>
    <div ref={viewport} role="region" aria-label="Route map. Use the arrow keys to pan." tabIndex={0}
      className="touch-none select-none cursor-grab active:cursor-grabbing"
      onKeyDown={event => {
        const offsets: Record<string, [number, number]> = {
          ArrowLeft: [100, 0], ArrowRight: [-100, 0], ArrowUp: [0, 100], ArrowDown: [0, -100],
        };
        const offset = offsets[event.key];
        if (!offset) return;
        event.preventDefault();
        move(shiftViewport(view, view.zoom, ...offset, true));
      }}
      onPointerDown={event => {
        if (!event.isPrimary || event.button !== 0 || busy.current) return;
        drag.current = { x: event.clientX, y: event.clientY, id: event.pointerId };
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerCancel={() => { drag.current = null; }}
      onPointerUp={event => {
        const start = drag.current;
        if (!start || start.id !== event.pointerId) return;
        drag.current = null;
        const dx = event.clientX - start.x, dy = event.clientY - start.y;
        if (Math.hypot(dx, dy) < 5) return;
        const rect = event.currentTarget.getBoundingClientRect();
        move(shiftViewport(view, view.zoom, dx * MAP_WIDTH / rect.width, dy * MAP_HEIGHT / rect.height, true));
      }}>
      {/* eslint-disable-next-line @next/next/no-img-element -- Private, transient provider image. */}
      <img src={detail?.image ?? image} alt="Road route with labeled visit markers" width={1280} height={840}
        draggable={false} className="h-auto w-full" />
    </div>
    {pending && <p role="status" className="px-3 py-1 text-sm">Loading map detail…</p>}
    {error && <p role="alert" className="px-3 py-1 text-sm">Map detail was unavailable. Try again.</p>}
  </div>;
}

export function Planner({ day, lead, visits, configured, depot }: {
  day: string; lead: string; visits: RouteVisit[]; configured: boolean; depot: string;
}) {
  const [state, action, pending] = useActionState(planRoute, {});
  const [dirty, setDirty] = useState(false);
  const [gps, setGps] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState("");
  const plan = dirty || pending ? undefined : state.plan;

  function useLocation() {
    setLocationError("");
    if (!navigator.geolocation) {
      setLocationError("Location is unavailable in this browser. Enter the truck’s current address instead.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setGps({ lat: coords.latitude, lng: coords.longitude });
        setDirty(true);
        setLocating(false);
      },
      () => {
        setLocationError("Couldn’t get your location. Check browser location permissions or enter the truck’s address.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  }

  return <div className="mt-4 grid gap-5 xl:grid-cols-[minmax(300px,0.85fr)_minmax(0,1.4fr)]">
    <div className="grid content-start gap-5">
      <form action={action} onReset={event => event.preventDefault()} onChange={() => setDirty(true)}
        onSubmit={() => setDirty(false)} className="portal-panel p-5">
        <input type="hidden" name="day" value={day} />
        <input type="hidden" name="lead" value={lead} />
        {gps && <>
          <input type="hidden" name="gps" value="on" />
          <input type="hidden" name="latitude" value={gps.lat} />
          <input type="hidden" name="longitude" value={gps.lng} />
        </>}
        <h3 className="font-semibold">Route setup</h3>
        <fieldset disabled={pending} className="mt-4 grid gap-3">
          {day === centralToday() && <div className="space-y-2">
            <button type="button" onClick={useLocation} disabled={locating}
              className="rounded-md border border-[#2a2119]/25 px-3 py-2 text-sm font-semibold">
              {locating ? "Finding location…" : gps ? "Refresh my location" : "Use my location"}
            </button>
            {gps && <p className="text-sm" role="status">Starting from your location now.{" "}
              <button type="button" className="underline" onClick={() => { setGps(null); setDirty(true); }}>Use an address</button>
            </p>}
            {locationError && <p role="alert" className="text-sm text-[#762f19]">{locationError}</p>}
          </div>}
          {!gps && <label className="grid gap-1 text-sm font-medium">Start address
            <input name="origin" className={input} defaultValue={depot} required maxLength={500} placeholder="Street, city, state ZIP" />
          </label>}
          <label className="grid gap-1 text-sm font-medium">End address
            <input name="destination" className={input} maxLength={500}
              required={Boolean(gps && !depot)} placeholder={gps ? "Returns to the shop if blank" : "Returns to start if blank"} />
          </label>
          <div className="grid grid-cols-2 gap-3">
            {!gps && <label className="grid gap-1 text-sm font-medium">Earliest start
              <input type="time" name="departure" className={input} required defaultValue="07:00" />
            </label>}
            <label className="grid gap-1 text-sm font-medium">Latest finish
              <input type="time" name="finish" className={input} required defaultValue="18:00" />
            </label>
          </div>
          {!gps && <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" name="flexible" className="mt-1" />
            <span><span className="font-semibold">Preview flexible visit times</span><br />
              <span className="text-[#6a5b50]">Find a proposed order within route hours. Confirm any new times with customers before updating bookings.</span>
            </span>
          </label>}
          <details className="rounded-md border border-[#2a2119]/20 p-3">
            <summary className="cursor-pointer text-sm font-semibold">Add an urgent call to the preview</summary>
            <div className="mt-3 grid gap-3">
              <label className="grid gap-1 text-sm font-medium">Urgent call address
                <input name="urgentAddress" className={input} maxLength={500} />
              </label>
              <label className="grid gap-1 text-sm font-medium">Latest arrival (Central Time)
                <input type="time" name="urgentDeadline" className={input} />
              </label>
              <label className="grid gap-1 text-sm font-medium">Minutes on site
                <input type="number" name="urgentMinutes" className={input} min={5} max={480} defaultValue={30} />
              </label>
            </div>
          </details>
        </fieldset>
        <button type="submit" disabled={!configured || pending || locating}
          className="mt-4 inline-flex items-center gap-2 rounded-md bg-[#17130f] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
          <Route size={17} aria-hidden="true" /> {pending ? "Calculating route…" : gps ? "Recalculate remaining stops" : "Calculate route"}
        </button>
        {!configured && <p className="mt-3 text-sm text-[#6a5b50]">Route maps need to be connected by your portal administrator.</p>}
        {!dirty && state.error && <p role="alert" className="mt-3 text-sm text-[#762f19]">{state.error}</p>}
      </form>
      <section className="portal-panel p-5">
        <h3 className="font-semibold">Scheduled visits</h3>
        {!visits.length && <p className="mt-2 text-sm text-[#6a5b50]">No scheduled field visits for this crew and day.</p>}
        <ul className="mt-2 divide-y divide-[#2a2119]/15 text-sm">
          {visits.map(visit => <li key={visit.id} className="py-3">
            <VisitLink visit={visit} />
            <p className="mt-1 text-[#6a5b50]">{time(visit.start)} – {time(visit.end)} · {visit.address || "Address needed"}</p>
          </li>)}
        </ul>
      </section>
    </div>
    <section className="portal-panel self-start overflow-hidden">
      <div className="border-b border-[#2a2119]/15 p-5">
        <h3 className="flex items-center gap-2 font-semibold"><MapPinned size={19} aria-hidden="true" /> Route map</h3>
        {plan && <p className="mt-1 text-sm text-[#6a5b50]" role="status">
          {plan.stops.length} routed · {plan.miles.toFixed(1)} mi · {plan.driveMinutes} min estimated driving
        </p>}
      </div>
      {plan ? <>
        {plan.map
          ? <RouteMap key={plan.map} image={plan.map} data={plan.mapData} />
          : <p className="p-5 text-sm text-[#762f19]">The map image was unavailable. Review the route details below.</p>}
        <div className="space-y-4 p-5 text-sm">
          {plan.map && <p className="text-[#6a5b50]">S is the start. Z marks a separate finish. Gray pins are visits that need attention.</p>}
          {plan.flexible && <p className="rounded-md bg-[#8f3f21]/10 p-3">Proposed visit times. The schedule still shows the original appointments.</p>}
          {plan.trafficWarning && <p className="rounded-md bg-[#8f3f21]/10 p-3">Traffic estimates are incomplete or may cause delays. Check the time between stops before dispatch.</p>}
          {plan.departure && plan.stops.length > 0 && <p><strong>Depart</strong> {time(plan.departure)}</p>}
          <ol className="space-y-3">
            {plan.stops.map(stop => <li key={stop.id} className="flex items-start gap-3">
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[#963c21] font-semibold text-white">{stop.marker}</span>
              <div><VisitLink visit={stop} /><p className="text-[#6a5b50]">{time(stop.visitStart)} · {stop.address}</p></div>
            </li>)}
          </ol>
          {plan.finish && plan.stops.length > 0 && <p><strong>Finish</strong> {time(plan.finish)}</p>}
          {plan.omitted.length > 0 && <section className="rounded-md border border-[#8f3f21]/30 p-4">
            <h4 className="font-semibold">{plan.omitted.length} {plan.omitted.length === 1 ? "visit needs" : "visits need"} attention</h4>
            <ul className="mt-2 space-y-2">{plan.omitted.map(({ visit, reason }) => <li key={visit.id}>
              <VisitLink visit={visit} /><p className="text-[#6a5b50]">{reason}</p>
            </li>)}</ul>
          </section>}
        </div>
      </> : <div className="grid min-h-64 place-items-center bg-[#f4efe5] p-8 text-center text-sm text-[#6a5b50]" role="status">
        {pending ? "Finding the route and checking visit times…" : "Calculate the route to see the stops, drive order, and estimated travel time."}
      </div>}
    </section>
  </div>;
}
