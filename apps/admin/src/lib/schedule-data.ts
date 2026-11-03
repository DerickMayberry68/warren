import "server-only";
import { createAdminClient } from "@warren/supabase/admin";
import { requireAdmin } from "./auth";
import type { CrewMember } from "./scheduling";

export async function schedulingCrew(): Promise<CrewMember[]> {
  await requireAdmin();
  const admin = createAdminClient();
  const crew: CrewMember[] = [];
  for (let page = 1; ; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 100 });
    if (error) throw new Error("Unable to load the staff directory.");
    crew.push(...data.users.filter(user => ["admin", "staff"].includes(user.app_metadata.role) && !user.banned_until).map(user => ({ id: user.id, name: [user.user_metadata.first_name, user.user_metadata.last_name].filter(x => typeof x === "string" && x).join(" ") || user.email || "Staff member" })));
    if (data.users.length < 100) break;
  }
  return crew.sort((a, b) => a.name.localeCompare(b.name));
}
