import type { Database } from "@warren/supabase/types";

export type Job = Database["public"]["Tables"]["jobs"]["Row"];
export type Booking = Database["public"]["Tables"]["bookings"]["Row"];
export type CrewMember = { id: string; name: string };
export const statuses = { new: "New", ready: "Ready to schedule", scheduled: "Scheduled", in_progress: "In progress", waiting: "Waiting", ready_pickup: "Ready for pickup", completed: "Completed" };
export const zone = "America/Chicago";
const wall = new Intl.DateTimeFormat("sv-SE", { timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
export function centralInput(iso: string) { return wall.format(new Date(iso)).replace(" ", "T"); }
export function centralToday() { return centralInput(new Date().toISOString()).slice(0, 10); }
export function validDay(value: string) { return /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value; }
export function shiftDay(day: string, count: number) { return new Date(Date.parse(day + "T12:00:00Z") + count * 86400000).toISOString().slice(0, 10); }
export function weekStart(day: string) {
  const date = validDay(day) ? day : centralToday();
  return shiftDay(date, -((new Date(date + "T12:00:00Z").getUTCDay() + 6) % 7));
}
export function parseCentral(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value) || !validDay(value.slice(0, 10))) throw new Error("Enter a valid date and time.");
  const target = Date.parse(value + ":00Z");
  if (!Number.isFinite(target)) throw new Error("Enter a valid date and time.");
  let guess = target;
  for (let i = 0; i < 4; i++) {
    const actual = Date.parse(centralInput(new Date(guess).toISOString()) + ":00Z");
    if (actual === target) return new Date(guess).toISOString();
    guess += target - actual;
  }
  throw new Error("That time does not exist in Central Time because of daylight saving. Choose another time.");
}
export function bookingDays(booking: Booking) {
  return booking.kind === "shop" ? [booking.start_day!, booking.end_day!] : [centralInput(booking.start_at!).slice(0, 10), centralInput(new Date(Date.parse(booking.end_at!) - 1).toISOString()).slice(0, 10)];
}
export function bookingLabel(booking: Booking) {
  if (booking.kind === "shop") return `${booking.start_day} – ${booking.end_day} · Flexible shop work`;
  const format = new Intl.DateTimeFormat("en-US", { timeZone: zone, month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  return `${format.format(new Date(booking.start_at!))} – ${format.format(new Date(booking.end_at!))} CT`;
}
