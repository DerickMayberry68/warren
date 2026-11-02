"use server";

import { requireStaff } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function setPassword(_state: { error: string }, form: FormData) {
  const { supabase } = await requireStaff();
  const password = String(form.get("password") ?? "");
  if (password.length < 12 || password.length > 128) return { error: "Use a password between 12 and 128 characters." };
  if (password !== form.get("confirmPassword")) return { error: "The passwords do not match." };
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: "Unable to save your password. Try again or ask your administrator for a new setup link." };
  redirect("/");
}
