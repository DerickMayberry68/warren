"use server";

import { createClient } from "@warren/supabase/server";
import { redirect } from "next/navigation";
import { isStaff } from "@/lib/auth";

export type LoginState = { error: string };

export async function signIn(_state: LoginState, form: FormData): Promise<LoginState> {
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  if (!email || !password || email.length > 254 || password.length > 1024) {
    return { error: "Enter your email address and password." };
  }
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) {
    return { error: "Unable to sign in. Check your email and password and try again." };
  }
  if (!isStaff(data.user.app_metadata.role)) {
    await supabase.auth.signOut({ scope: "local" });
    return { error: "This account does not have Warren staff access. Contact your administrator." };
  }
  redirect("/");
}

export async function signOut() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut({ scope: "local" });
  if (error) throw new Error("Unable to sign out. Please try again.");
  redirect("/login");
}
