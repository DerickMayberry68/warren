import { requireStaff } from "@/lib/auth";
import { PasswordForm } from "./password-form";
import Link from "next/link";

export default async function SetPasswordPage() {
  await requireStaff();
  return <section className="max-w-xl">
    <div className="portal-page-heading"><div><h1>Password settings</h1><p>Set or update the password for your Warren account.</p></div></div>
    <div className="portal-panel p-6">
      <PasswordForm />
      <Link href="/" className="mt-6 inline-block text-sm underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4">Back to dashboard</Link>
    </div>
  </section>;
}
