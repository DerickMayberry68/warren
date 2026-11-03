"use client";

import { useActionState } from "react";
import { setPassword } from "./actions";

export function PasswordForm() {
  const [state, action, pending] = useActionState(setPassword, { error: "" });
  return <form action={action} className="mt-8 grid gap-5">
    <label className="grid gap-2 text-sm font-medium">New password
      <input name="password" type="password" autoComplete="new-password" minLength={12} maxLength={128} required className="h-12 rounded-md border border-[#2a2119]/25 bg-white px-3 focus-visible:outline-2 focus-visible:outline-[#8f3f21]" />
    </label>
    <p className="text-sm text-[#6a5b50]">Use at least 12 characters.</p>
    <label className="grid gap-2 text-sm font-medium">Confirm password
      <input name="confirmPassword" type="password" autoComplete="new-password" minLength={12} maxLength={128} required className="h-12 rounded-md border border-[#2a2119]/25 bg-white px-3 focus-visible:outline-2 focus-visible:outline-[#8f3f21]" />
    </label>
    <div aria-live="polite">{state.error && <p role="alert" className="text-sm text-[#762f19]">{state.error}</p>}</div>
    <button disabled={pending} className="h-12 rounded-md bg-[#17130f] px-5 font-semibold text-[#f7f0e2] focus-visible:outline-2 focus-visible:outline-offset-4 disabled:opacity-60">{pending ? "Saving…" : "Save password"}</button>
  </form>;
}
