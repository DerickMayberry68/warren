"use server";

import { createAdminClient } from "@warren/supabase/admin";
import { requireAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { readStaffProfile } from "@/lib/staff-profile";

export type StaffState = { error?: string; message?: string; tokenHash?: string };
const validRole = (role: string) => role === "admin" || role === "staff";

export async function addStaff(_state: StaffState, form: FormData): Promise<StaffState> {
  await requireAdmin();
  const { profile, error: profileError } = readStaffProfile(form);
  if (profileError) return { error: profileError };
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const role = String(form.get("role") ?? "");
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !validRole(role)) {
    return { error: "Enter a valid email and choose Staff or Admin." };
  }
  const admin = createAdminClient();
  // Create atomically with its role. Existing accounts are never overwritten.
  const { data, error } = await admin.auth.admin.createUser({ email, email_confirm: true, app_metadata: { role }, user_metadata: profile });
  if (error || !data.user) return { error: "Could not add this account. It may already exist; check the staff list before trying again." };
  const link = await admin.auth.admin.generateLink({ type: "recovery", email });
  revalidatePath("/staff");
  if (link.error) return { error: "The account was created, but its setup link could not be generated. Use New setup link beside the account." };
  return { message: `Added ${email} with ${role === "admin" ? "Admin" : "Staff"} access. Share this private setup link with them. No email was sent.`, tokenHash: link.data.properties.hashed_token };
}

export async function updateStaffProfile(_state: StaffState, form: FormData): Promise<StaffState> {
  await requireAdmin();
  const id = String(form.get("id") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(id)) return { error: "Choose a valid staff account." };
  const { profile, error: profileError } = readStaffProfile(form);
  if (profileError) return { error: profileError };
  const admin = createAdminClient();
  const target = await admin.auth.admin.getUserById(id);
  if (target.error || !target.data.user) return { error: "This account could not be found." };
  // Profile details are descriptive only. Permissions remain in app_metadata.
  const { error } = await admin.auth.admin.updateUserById(id, {
    user_metadata: { ...target.data.user.user_metadata, ...profile },
  });
  if (error) return { error: "Could not save these details. Try again." };
  revalidatePath("/staff");
  return { message: "Staff details saved." };
}

export async function changeRole(_state: StaffState, form: FormData): Promise<StaffState> {
  const { user } = await requireAdmin();
  const id = String(form.get("id") ?? "");
  const role = String(form.get("role") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(id) || !validRole(role)) return { error: "Choose a valid staff member and role." };
  if (id === user.id) return { error: "You cannot change your own role." };
  const admin = createAdminClient();
  const target = await admin.auth.admin.getUserById(id);
  if (target.error || !target.data.user) return { error: "This account could not be found." };
  const { error } = await admin.auth.admin.updateUserById(id, {
    app_metadata: { ...target.data.user.app_metadata, role },
  });
  if (error) return { error: "Could not change access. Try again." };
  revalidatePath("/staff");
  return { message: "Access role updated." };
}

export async function newSetupLink(_state: StaffState, form: FormData): Promise<StaffState> {
  const { user } = await requireAdmin();
  const id = String(form.get("id") ?? "");
  if (id === user.id) return { error: "Use Password settings to change your own password." };
  if (!/^[0-9a-f-]{36}$/i.test(id)) return { error: "Choose a valid staff member." };
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.getUserById(id);
  if (error || !data.user.email || !validRole(data.user.app_metadata.role)) return { error: "Staff account not found." };
  const link = await admin.auth.admin.generateLink({ type: "recovery", email: data.user.email });
  if (link.error) return { error: "Could not generate a setup link. Try again." };
  return { message: `New private setup link for ${data.user.email}. No email was sent.`, tokenHash: link.data.properties.hashed_token };
}
