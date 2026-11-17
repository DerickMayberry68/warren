"use server";

import { requireStaff } from "@/lib/auth";
import { geocodeAddress, optimizeTour, routeMap, routingConfigured, type RouteMapData } from "@/lib/google-routing";
import { routeVisits, type RouteVisit } from "@/lib/route-visits";
import { centralToday, parseCentral, validDay } from "@/lib/scheduling";

type PlannedStop = RouteVisit & { visitStart: string; marker: string };
type OmittedStop = { visit: RouteVisit; reason: string };
export type PlanState = {
  error?: string;
  plan?: {
    stops: PlannedStop[];
    omitted: OmittedStop[];
    map: string | null;
    mapData: RouteMapData;
    miles: number;
    driveMinutes: number;
    departure?: string;
    finish?: string;
    flexible: boolean;
    trafficWarning: boolean;
  };
};

export async function planRoute(_previous: PlanState, form: FormData): Promise<PlanState> {
  const { user } = await requireStaff();
  const read = (name: string) => String(form.get(name) ?? "").trim();
  const day = read("day");
  const lead = read("lead");
  if (!validDay(day) || !/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(lead)) {
    return { error: "Choose a day and crew lead." };
  }
  if (user.app_metadata.role !== "admin" && lead !== user.id) return { error: "Choose your own crew route." };
  if (!routingConfigured()) return { error: "Route maps are not connected yet." };

  const origin = read("origin");
  const gps = read("gps") === "on";
  const point = gps ? { lat: Number(read("latitude")), lng: Number(read("longitude")) } : null;
  if (gps && (day !== centralToday() || !read("latitude") || !read("longitude") || !point ||
    !Number.isFinite(point.lat) || !Number.isFinite(point.lng) || Math.abs(point.lat) > 85 || Math.abs(point.lng) > 180)) {
    return { error: "Select today and use a valid current location to replan." };
  }
  const destination = read("destination") || (gps ? process.env.WARREN_ROUTE_DEPOT_ADDRESS?.trim() : origin);
  if ((!gps && !origin) || !destination || origin.length > 500 || destination.length > 500) {
    return { error: "Enter a full starting address and an optional ending address." };
  }
  let departure: string;
  let finish: string;
  try {
    departure = gps ? new Date().toISOString() : parseCentral(day + "T" + read("departure"));
    finish = parseCentral(day + "T" + read("finish"));
  } catch {
    return { error: "Enter valid Central Time hours for this day." };
  }
  if (Date.parse(finish) <= Date.parse(departure)) return { error: "The route must end after it starts." };
  const flexible = !gps && read("flexible") === "on";
  const urgentAddress = read("urgentAddress");
  let urgent: (RouteVisit & { latestArrival: string }) | undefined;
  if (urgentAddress || read("urgentDeadline")) {
    const minutes = Number(read("urgentMinutes"));
    let latestArrival: string;
    try {
      latestArrival = parseCentral(day + "T" + read("urgentDeadline"));
    } catch {
      return { error: "Enter a latest arrival time for the urgent call." };
    }
    if (!urgentAddress || urgentAddress.length > 500 || !Number.isInteger(minutes) || minutes < 5 || minutes > 480 ||
      Date.parse(latestArrival) < Date.parse(departure) || Date.parse(latestArrival) > Date.parse(finish)) {
      return { error: "Enter a full urgent call address, a duration of 5–480 minutes, and a deadline within route hours." };
    }
    urgent = {
      id: "urgent", jobId: "", leadId: lead, title: "Urgent service call", number: 0, address: urgentAddress,
      start: departure, end: new Date(Date.parse(departure) + minutes * 60000).toISOString(), latestArrival,
    };
  }

  try {
    const scheduled = await routeVisits(day, 1, lead);
    const visits = urgent ? [...scheduled, urgent] : scheduled;
    if (visits.length === 0) return { error: "There are no scheduled field visits for this crew and day." };
    if (visits.length > 20) return { error: "This planner supports up to 20 field visits per crew per day." };

    const geocodes = new Map<string, ReturnType<typeof geocodeAddress>>();
    function locate(address: string) {
      const cached = geocodes.get(address);
      if (cached) return cached;
      const lookup = geocodeAddress(address);
      geocodes.set(address, lookup);
      return lookup;
    }

    const [startPoint, endPoint, locations] = await Promise.all([
      point ?? locate(origin),
      locate(destination),
      Promise.all(visits.map(visit => visit.address ? locate(visit.address) : null)),
    ]);
    if (!startPoint || !endPoint) return { error: "Check the start and end addresses. Include the street number, city, and state or ZIP." };

    const omitted: OmittedStop[] = [];
    const stops = visits.flatMap((visit, index) => {
      const point = locations[index];
      if (!point) {
        omitted.push({ visit, reason: "Add or correct the street address on the booking." });
        return [];
      }
      const latestArrival = visit.id === urgent?.id ? urgent.latestArrival : undefined;
      if (!latestArrival && !flexible && (Date.parse(visit.start) < Date.parse(departure) || Date.parse(visit.end) > Date.parse(finish))) {
        omitted.push({ visit, reason: "This appointment is outside the route hours." });
        return [];
      }
      return [{ visit, point, start: visit.start, end: visit.end, index, latestArrival }];
    });

    const tour = stops.length ? await optimizeTour({
      stops, origin: startPoint, destination: endPoint, departure, finish, flexible,
    }) : undefined;
    const ordered = (tour?.visits ?? []).map(result => {
      const stop = stops[result.shipmentIndex ?? 0];
      if (!stop || !Number.isFinite(Date.parse(result.startTime))) throw new Error("Invalid routing result");
      return { ...stop, visitStart: result.startTime };
    });
    const routed = new Set(ordered.map(stop => stop.index));
    if (routed.size !== ordered.length) throw new Error("Duplicate routing result");
    for (const stop of stops) {
      if (!routed.has(stop.index)) omitted.push({ visit: stop.visit, reason: "This stop did not fit the route hours, drive time, or appointment times." });
    }
    const transitions = tour?.transitions ?? [];
    const polyline = tour?.routePolyline?.points;
    const mapData = {
      origin: startPoint,
      destination: endPoint,
      ordered: ordered.map(stop => stop.point),
      omitted: locations.flatMap((point, index) => point && !routed.has(index) ? [point] : []),
      polyline,
    };
    const map = ordered.length && !polyline ? null : await routeMap(mapData).catch(() => null);

    return { plan: {
      stops: ordered.map((stop, index) => ({
        ...stop.visit,
        visitStart: stop.visitStart,
        marker: (index + 1).toString(36).toUpperCase(),
      })),
      omitted,
      map,
      mapData,
      miles: transitions.reduce((sum, leg) => sum + (leg.travelDistanceMeters ?? 0), 0) / 1609.344,
      driveMinutes: Math.round(transitions.reduce((sum, leg) => sum + Number.parseFloat(leg.travelDuration ?? "0"), 0) / 60),
      departure: tour?.vehicleStartTime,
      finish: tour?.vehicleEndTime,
      flexible,
      trafficWarning: Boolean(tour?.hasTrafficInfeasibilities || transitions.some(leg => leg.trafficInfoUnavailable)),
    } };
  } catch {
    return { error: "The route could not be calculated. Check the mapping connection and try again." };
  }
}

export async function zoomRouteMap(data: RouteMapData, center: RouteMapData["origin"], zoom: number) {
  await requireStaff();
  const valid = (point: RouteMapData["origin"]) => point && Math.abs(point.lat) <= 85 && Math.abs(point.lng) <= 180;
  if (!routingConfigured() || !Number.isInteger(zoom) || zoom < 0 || zoom > 19 || !valid(center) ||
    !Array.isArray(data.ordered) || !Array.isArray(data.omitted) ||
    data.ordered.length + data.omitted.length > 20 || (data.polyline?.length ?? 0) > 250000 ||
    ![data.origin, data.destination, ...data.ordered, ...data.omitted].every(valid)) return null;
  return routeMap(data, { center, zoom }).catch(() => null);
}
