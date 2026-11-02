import { createClient } from "@warren/supabase/server";
import { redirect } from "next/navigation";
import { isStaff } from "@/lib/auth";
import { LoginForm } from "./login-form";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user && isStaff(user.app_metadata.role)) redirect("/");
  return (
    <main className="grid min-h-screen bg-[#17130f] px-5 py-12 text-[#17130f] sm:place-items-center">
      <section className="m-auto w-full max-w-md rounded-lg border-t-4 border-[#d9762a] bg-[#f4efe5] px-6 py-8 shadow-2xl sm:px-10 sm:py-10" aria-labelledby="login-title">
        <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-[#8f3f21]">Warren Welding &amp; Generators</p>
        <h1 id="login-title" className="mt-6 text-3xl font-semibold tracking-tight">Staff sign in</h1>
        <p className="mt-3 text-sm leading-6 text-[#6a5b50]">Manage incoming requests and keep the shop moving.</p>
        {error === "expired-link" && <p role="alert" className="mt-4 text-sm text-[#762f19]">This setup link is invalid or has expired. Ask your administrator for a new link.</p>}
        <LoginForm />
      </section>
    </main>
  );
}
