import { decode } from "@googlemaps/polyline-codec";
import type { RouteMapData } from "./google-routing";

export type MapPoint = { lat: number; lng: number };
export type MapViewport = { center: MapPoint; zoom: number };
export const MAP_WIDTH = 640;
export const MAP_HEIGHT = 420;

function project({ lat, lng }: MapPoint) {
  const radians = Math.max(-85, Math.min(85, lat)) * Math.PI / 180;
  return { x: (lng + 180) / 360, y: (1 - Math.asinh(Math.tan(radians)) / Math.PI) / 2 };
}

function unproject(x: number, y: number): MapPoint {
  return {
    lng: ((x % 1 + 1) % 1) * 360 - 180,
    lat: Math.max(-85, Math.min(85, Math.atan(Math.sinh(Math.PI * (1 - 2 * y))) * 180 / Math.PI)),
  };
}

export function fitRoute(data: RouteMapData): MapViewport {
  const points = [data.origin, data.destination, ...data.ordered, ...data.omitted];
  if (data.polyline) for (const [lat, lng] of decode(data.polyline)) points.push({ lat, lng });
  const bounds = points.map(project);
  const xs = bounds.map(point => point.x);
  const ys = bounds.map(point => point.y);
  const left = Math.min(...xs), right = Math.max(...xs);
  const top = Math.min(...ys), bottom = Math.max(...ys);
  const scale = Math.min((MAP_WIDTH - 80) / (right - left), (MAP_HEIGHT - 80) / (bottom - top));
  return {
    center: unproject((left + right) / 2, (top + bottom) / 2),
    zoom: Math.max(0, Math.min(15, Math.floor(Math.log2(scale / 256)))),
  };
}

export function shiftViewport(view: MapViewport, zoom: number, x: number, y: number, pan = false): MapViewport {
  const center = project(view.center);
  const oldScale = 256 * 2 ** view.zoom;
  const scale = pan ? -1 / oldScale : 1 / oldScale - 1 / (256 * 2 ** zoom);
  return { zoom, center: unproject(center.x + x * scale, center.y + y * scale) };
}
