"use client";

import { useActionState, useState } from "react";
import { addStaff, changeRole, newSetupLink, updateStaffProfile, type StaffState } from "./actions";
import type { StaffProfile } from "@/lib/staff-profile";

const field = "h-11 min-w-0 w-full rounded-md border border-black/25 bg-white px-3 text-[#17130f] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8f3f21]";
const button = "rounded-md bg-[#17130f] px-4 py-3 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-4 disabled:opacity-60";

function Result({ state }: { state: StaffState }) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const link = () => `${window.location.origin}/auth/confirm?token_hash=${encodeURIComponent(state.tokenHash!)}&type=recovery`;
  return <div className="mt-3 text-sm" aria-live="polite">
    {state.error && <p role="alert" className="text-[#8f3f21]">{state.error}</p>}
    {state.message && <p>{state.message}</p>}
    {state.tokenHash && <button type="button" className="mt-3 rounded-md border border-current/30 px-3 py-2 font-medium" onClick={async () => {
      try { await navigator.clipboard.writeText(link()); setCopied(true); setCopyError(false); }
      catch { setCopyError(true); }
    }}>{copied ? "Setup link copied" : "Copy setup link"}</button>}
    {copyError && <p role="alert">Clipboard access failed. Allow clipboard access for this site and try again.</p>}
  </div>;
}

function RoleSelect({ role = "staff", label = "Access role" }: { role?: string; label?: string }) {
  return <label className="grid min-w-0 gap-2 text-sm font-medium">{label}<select name="role" defaultValue={role} className={field}>
    <option value="none" disabled>No access — choose a role</option>
    <option value="staff">Staff</option><option value="admin">Admin</option>
  </select></label>;
}

export function AddStaffForm() {
  const [state, action, pending] = useActionState(addStaff, {});
  return <form action={action}>
    <div className="grid gap-4 sm:grid-cols-2">
      <ProfileFields />
      <label className="grid gap-2 text-sm font-medium">Email<input className={field} name="email" type="email" autoComplete="off" maxLength={254} required /></label>
      <RoleSelect />
    </div>
    <button className={`${button} mt-5`} disabled={pending}>{pending ? "Adding…" : "Add staff"}</button>
    <Result key={state.tokenHash ?? state.error ?? state.message} state={state} />
  </form>;
}

function ProfileFields({ profile }: { profile?: StaffProfile }) {
  return <>
    <label className="grid min-w-0 gap-2 text-sm font-medium">First name<input className={field} name="first_name" defaultValue={profile?.first_name} maxLength={100} autoComplete="off" required /></label>
    <label className="grid min-w-0 gap-2 text-sm font-medium">Last name<input className={field} name="last_name" defaultValue={profile?.last_name} maxLength={100} autoComplete="off" required /></label>
    <label className="grid min-w-0 gap-2 text-sm font-medium">Phone (optional)<input className={field} name="phone" type="tel" defaultValue={profile?.phone} maxLength={40} autoComplete="off" /></label>
    <label className="grid min-w-0 gap-2 text-sm font-medium">Job title (optional)<input className={field} name="job_title" defaultValue={profile?.job_title} maxLength={100} autoComplete="off" /></label>
  </>;
}

export function StaffProfileForm({ id, email, profile }: { id: string; email: string; profile: StaffProfile }) {
  const [state, action, pending] = useActionState(updateStaffProfile, {});
  return <details className="mt-4">
    <summary className="w-fit cursor-pointer text-sm font-medium underline underline-offset-4">Edit staff details</summary>
    <form action={action} className="mt-4">
      <input type="hidden" name="id" value={id} />
      <div className="grid gap-4 sm:grid-cols-2"><ProfileFields profile={profile} /></div>
      <label className="mt-4 grid gap-2 text-sm font-medium">Sign-in email<input className={`${field} bg-black/5`} type="email" value={email} readOnly /></label>
      <p className="mt-2 text-sm text-[#6a5b50]">Sign-in email is read-only here.</p>
      <button className={`${button} mt-4`} disabled={pending}>{pending ? "Saving…" : "Save details"}</button>
      <Result state={state} />
    </form>
  </details>;
}

export function StaffControls({ id, role, email }: { id: string; role: string; email: string }) {
  const [state, action, pending] = useActionState(changeRole, {});
  const [setup, setupAction, setupPending] = useActionState(newSetupLink, {});
  return <div className="grid gap-4">
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <div className="flex flex-wrap items-end gap-3"><RoleSelect role={role} label={`Access for ${email}`} /><button className={button} disabled={pending}>{pending ? "Saving…" : "Save role"}</button></div>
      <Result state={state} />
    </form>
    <form action={setupAction}>
      <input type="hidden" name="id" value={id} />
      <button disabled={setupPending} className="text-sm underline underline-offset-4 disabled:opacity-60">{setupPending ? "Generating…" : "New setup link"}</button>
      <Result key={setup.tokenHash ?? setup.error} state={setup} />
    </form>
  </div>;
}
