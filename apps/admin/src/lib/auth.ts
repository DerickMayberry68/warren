import "server-only";
import { createClient } from "@warren/supabase/server";
import { redirect } from "next/navigation";
import { cache } from "react";

export function isStaff(role: unknown) {
  return role === "admin" || role === "staff";
}

export const requireStaff = cache(async () => {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect("/login");
  if (!isStaff(user.app_metadata.role)) redirect("/access-denied");
  return { supabase, user };
});

export async function requireAdmin() {
  const session = await requireStaff();
  if (session.user.app_metadata.role !== "admin") redirect("/");
  return session;
}
