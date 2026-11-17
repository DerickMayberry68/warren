import "server-only";
import { decode, encode } from "@googlemaps/polyline-codec";
import { fitRoute, MAP_HEIGHT, MAP_WIDTH } from "./route-viewport";
import { GoogleAuth } from "google-auth-library";

type Point = { lat: number; lng: number };
type Geocode = {
  status: string;
  results: {
    partial_match?: boolean;
    geometry: { location: Point; location_type: string };
  }[];
};
type Stop = { point: Point; start: string; end: string; latestArrival?: string };
type Transition = { travelDuration?: string; travelDistanceMeters?: number; trafficInfoUnavailable?: boolean };
type Tour = {
  vehicleStartTime?: string;
  vehicleEndTime?: string;
  visits?: { shipmentIndex?: number; startTime: string }[];
  transitions?: Transition[];
  routePolyline?: { points: string };
  hasTrafficInfeasibilities?: boolean;
};

export function routingConfigured() {
  return Boolean(process.env.GOOGLE_MAPS_SERVER_KEY && process.env.GOOGLE_ROUTING_PROJECT_ID &&
    process.env.GOOGLE_ROUTING_SERVICE_ACCOUNT_JSON);
}

export async function geocodeAddress(address: string): Promise<Point | null> {
  const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
  url.search = new URLSearchParams({ address, key: process.env.GOOGLE_MAPS_SERVER_KEY!, region: "us" }).toString();
  const response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw new Error("Geocoding request failed");
  const data: Geocode = await response.json();
  if (data.status === "ZERO_RESULTS") return null;
  if (data.status !== "OK") throw new Error("Geocoding is unavailable");
  if (data.results.length !== 1) return null;
  const match = data.results[0];
  if (match.partial_match || !["ROOFTOP", "RANGE_INTERPOLATED"].includes(match.geometry.location_type)) return null;
  return match.geometry.location;
}

export async function optimizeTour(options: {
  stops: Stop[]; origin: Point; destination: Point; departure: string; finish: string; flexible: boolean;
}) {
  const { stops, origin, destination, departure, finish, flexible } = options;
  const auth = new GoogleAuth({
    credentials: JSON.parse(process.env.GOOGLE_ROUTING_SERVICE_ACCOUNT_JSON!),
    scopes: ["https://www.googleapis.com/auth/cloud-platform"],
  });
  const location = (point: Point) => ({ latitude: point.lat, longitude: point.lng });
  const { data } = await auth.request<{ routes?: Tour[] }>({
    url: `https://routeoptimization.googleapis.com/v1/projects/${encodeURIComponent(process.env.GOOGLE_ROUTING_PROJECT_ID!)}:optimizeTours`,
    method: "POST",
    timeout: 15000,
    retry: false,
    data: {
      timeout: "8s",
      considerRoadTraffic: true,
      populatePolylines: true,
      model: {
        globalStartTime: departure,
        globalEndTime: finish,
        shipments: stops.map(stop => ({
          penaltyCost: stop.latestArrival ? 100000 : 10000,
          deliveries: [{
            arrivalLocation: location(stop.point),
            duration: `${Math.ceil((Date.parse(stop.end) - Date.parse(stop.start)) / 1000)}s`,
            ...(stop.latestArrival
              ? { timeWindows: [{ startTime: departure, endTime: stop.latestArrival }] }
              : flexible ? {} : { timeWindows: [{ startTime: stop.start, endTime: stop.start }] }),
          }],
        })),
        vehicles: [{
          startLocation: location(origin),
          endLocation: location(destination),
          costPerTraveledHour: 60,
          costPerHour: 1,
        }],
      },
    },
  });
  return data.routes?.[0];
}

function simplifyPath(points: [number, number][], tolerance: number): [number, number][] {
  const first = points[0];
  const last = points[points.length - 1];
  const dx = last[0] - first[0];
  const dy = last[1] - first[1];
  const lengthSquared = dx * dx + dy * dy;
  let farthest = tolerance * tolerance;
  let split = 0;
  for (let index = 1; index < points.length - 1; index++) {
    const x = points[index][0] - first[0];
    const y = points[index][1] - first[1];
    const fraction = lengthSquared ? Math.max(0, Math.min(1, (x * dx + y * dy) / lengthSquared)) : 0;
    const distance = (x - fraction * dx) ** 2 + (y - fraction * dy) ** 2;
    if (distance > farthest) {
      farthest = distance;
      split = index;
    }
  }
  if (!split) return [first, last];
  return [
    ...simplifyPath(points.slice(0, split + 1), tolerance).slice(0, -1),
    ...simplifyPath(points.slice(split), tolerance),
  ];
}

export type RouteMapData = {
  origin: Point; destination: Point; ordered: Point[]; omitted: Point[]; polyline?: string;
};

export async function routeMap(options: RouteMapData, viewport = fitRoute(options)) {
  const { origin, destination, ordered, omitted, polyline } = options;
  const coordinate = ({ lat, lng }: Point) => `${lat.toFixed(6)},${lng.toFixed(6)}`;
  const url = new URL("https://maps.googleapis.com/maps/api/staticmap");
  const params = new URLSearchParams({
    size: `${MAP_WIDTH}x${MAP_HEIGHT}`, scale: "2", key: process.env.GOOGLE_MAPS_SERVER_KEY!,
    center: coordinate(viewport.center), zoom: String(viewport.zoom),
  });
  const same = coordinate(origin) === coordinate(destination);
  params.append("markers", `color:0x28211a|label:S|${coordinate(origin)}`);
  if (!same) params.append("markers", `color:0x28211a|label:Z|${coordinate(destination)}`);
  ordered.forEach((point, index) => {
    params.append("markers", `color:0xb45c2c|label:${(index + 1).toString(36).toUpperCase()}|${coordinate(point)}`);
  });
  if (omitted.length) params.append("markers", `color:gray|${omitted.map(coordinate).join("|")}`);
  const setPath = (path: string) => {
    params.set("path", `weight:5|color:0x963c21|enc:${path}`);
    url.search = params.toString();
  };
  url.search = params.toString();
  if (polyline) {
    setPath(polyline);
    if (url.href.length > 16384) {
      const points = decode(polyline);
      // Keep the route shape while reducing detail for the static map URL limit.
      for (let tolerance = 0.00002; url.href.length > 16384 && tolerance <= 0.01; tolerance *= 2) {
        setPath(encode(simplifyPath(points, tolerance)));
      }
    }
  }
  if (url.href.length > 16384) return null;
  const response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(8000) });
  if (!response.ok || !response.headers.get("content-type")?.startsWith("image/")) return null;
  if (response.headers.has("x-staticmap-api-warning")) return null;
  const mime = response.headers.get("content-type")!.split(";")[0];
  return `data:${mime};base64,${Buffer.from(await response.arrayBuffer()).toString("base64")}`;
}
