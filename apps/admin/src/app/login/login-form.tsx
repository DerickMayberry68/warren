"use client";

import { useActionState } from "react";
import { signIn } from "./actions";

export function LoginForm() {
  const [state, action, pending] = useActionState(signIn, { error: "" });
  return (
    <form action={action} className="mt-8 grid gap-5">
      <label className="grid gap-2 text-sm font-medium">Email
        <input name="email" type="email" autoComplete="username" required maxLength={254}
          className="h-12 rounded-md border border-[#2a2119]/25 bg-white px-3 text-[#17130f] outline-none focus-visible:ring-2 focus-visible:ring-[#8f3f21]" />
      </label>
      <label className="grid gap-2 text-sm font-medium">Password
        <input name="password" type="password" autoComplete="current-password" required maxLength={1024}
          className="h-12 rounded-md border border-[#2a2119]/25 bg-white px-3 text-[#17130f] outline-none focus-visible:ring-2 focus-visible:ring-[#8f3f21]" />
      </label>
      <div aria-live="polite" aria-atomic="true">
        {state.error && <p role="alert" className="rounded-md border border-[#8f3f21]/30 bg-[#8f3f21]/5 p-3 text-sm text-[#762f19]">{state.error}</p>}
      </div>
      <button disabled={pending} className="h-12 rounded-md bg-[#17130f] px-5 font-semibold text-[#f7f0e2] hover:bg-[#3a2a20] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#8f3f21] disabled:opacity-60">
        {pending ? "Signing in…" : "Sign in"}
      </button>
      <p className="text-sm leading-6 text-[#6a5b50]">Accounts are created by your administrator. If you need access or help with your password, contact them.</p>
    </form>
  );
}
