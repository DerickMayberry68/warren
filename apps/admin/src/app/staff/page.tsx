import Link from "next/link";
import { createAdminClient } from "@warren/supabase/admin";
import { requireAdmin } from "@/lib/auth";
import { AddStaffForm, StaffControls, StaffProfileForm } from "./staff-forms";
import { staffProfileFromMetadata } from "@/lib/staff-profile";

export default async function StaffPage() {
  const { user } = await requireAdmin();
  const admin = createAdminClient();
  const users = [];
  for (let page = 1; ; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 100 });
    if (error) throw new Error("Unable to load staff. Please try again.");
    users.push(...data.users);
    if (data.users.length < 100) break;
  }
  return <main className="min-h-screen bg-[#f4efe5] px-5 py-8 text-[#17130f] sm:px-8">
    <div className="mx-auto max-w-5xl">
      <Link href="/" className="text-sm underline underline-offset-4">Back to dashboard</Link>
      <p className="mt-8 font-mono text-xs uppercase tracking-[0.2em] text-[#8f3f21]">Warren Welding &amp; Generators</p>
      <h1 className="mt-3 text-3xl font-semibold">Staff &amp; access</h1>
      <p className="mt-3 max-w-2xl leading-7 text-[#6a5b50]">Staff can use the workspace. Admins can also add people and manage their roles. Only give Admin access to people who should manage accounts.</p>
      <section className="mt-8 rounded-lg border border-[#2a2119]/15 bg-[#fffaf0] p-5 sm:p-6" aria-labelledby="add-staff">
        <h2 id="add-staff" className="mb-5 text-lg font-semibold">Add a staff member</h2>
        <AddStaffForm />
        <p className="mt-5 text-sm leading-6 text-[#6a5b50]">After adding someone, copy their private setup link and share it directly with them. It expires and can only be used once. No invitation email is sent.</p>
      </section>
      <section className="mt-8" aria-labelledby="staff-list">
        <h2 id="staff-list" className="text-xl font-semibold">People with accounts</h2>
        <div className="mt-4 divide-y divide-[#2a2119]/15 rounded-lg border border-[#2a2119]/15 bg-[#fffaf0]">
          {users.map(person => {
            const profile = staffProfileFromMetadata(person.user_metadata);
            const name = [profile.first_name, profile.last_name].filter(Boolean).join(" ");
            return <article key={person.id} className="grid gap-5 p-5 sm:grid-cols-[1.4fr_1fr] sm:p-6">
            <div><h3 className="break-words font-semibold">{name || person.email}</h3>
              {name && <p className="mt-1 break-all text-sm text-[#6a5b50]">{person.email}</p>}
              {profile.job_title && <p className="mt-2 text-sm">{profile.job_title}</p>}
              {profile.phone && <p className="mt-2 text-sm">{profile.phone}</p>}
              <p className="mt-2 text-sm text-[#6a5b50]">{person.last_sign_in_at ? "Has signed in" : "Awaiting first sign-in"}</p>
              <StaffProfileForm id={person.id} email={person.email ?? ""} profile={profile} />
            </div>
            {person.id === user.id ? <p className="text-sm">Admin · Your account<br /><Link href="/set-password" className="mt-2 inline-block underline underline-offset-4">Password settings</Link></p> :
              <StaffControls id={person.id} role={["admin", "staff"].includes(person.app_metadata.role) ? person.app_metadata.role : "none"} email={person.email ?? "this account"} />}
          </article>;
          })}
        </div>
      </section>
    </div>
  </main>;
}
