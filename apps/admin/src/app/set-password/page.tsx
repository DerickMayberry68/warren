import { requireStaff } from "@/lib/auth";
import { PasswordForm } from "./password-form";
import Link from "next/link";

export default async function SetPasswordPage() {
  await requireStaff();
  return <main className="grid min-h-screen place-items-center bg-[#17130f] p-5 text-[#17130f]">
    <section className="w-full max-w-md rounded-lg border-t-4 border-[#d9762a] bg-[#f4efe5] p-8">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#8f3f21]">Warren Welding &amp; Generators</p>
      <h1 className="mt-6 text-3xl font-semibold">Set your password</h1>
      <PasswordForm />
      <Link href="/" className="mt-6 inline-block text-sm underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4">Back to dashboard</Link>
    </section>
  </main>;
}
