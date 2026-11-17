"use client";

import { createClient } from "@warren/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const tables = ["jobs", "bookings", "booking_assignments"] as const;

// Re-renders the current portal page whenever schedule data changes anywhere,
// so the shop board, calendar, job pages and route planner stay in sync across users.
export function LiveRefresh() {
  const router = useRouter();
  useEffect(() => {
    const supabase = createClient();
    let timer: ReturnType<typeof setTimeout> | undefined;
    let connectedBefore = false;
    // Several rows often change together (a job and its bookings), so batch them into one refresh.
    const refresh = () => { clearTimeout(timer); timer = setTimeout(() => router.refresh(), 400); };
    let channel = supabase.channel("schedule-changes");
    for (const table of tables) channel = channel.on("postgres_changes", { event: "*", schema: "public", table }, refresh);
    channel.subscribe(status => {
      // After a dropped connection, catch up on anything missed while offline.
      if (status === "SUBSCRIBED") { if (connectedBefore) refresh(); connectedBefore = true; }
    });
    const onVisible = () => { if (document.visibilityState === "visible") refresh(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => { clearTimeout(timer); document.removeEventListener("visibilitychange", onVisible); supabase.removeChannel(channel); };
  }, [router]);
  return null;
}
