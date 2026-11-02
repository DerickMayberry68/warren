import { createClient } from "@warren/supabase/server";
import { redirect } from "next/navigation";
import { isStaff } from "@/lib/auth";
import { signOut } from "@/app/login/actions";

export default async function AccessDenied() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (isStaff(user.app_metadata.role)) redirect("/");
  return (
    <main className="grid min-h-screen place-items-center bg-[#f4efe5] p-6 text-[#17130f]">
      <section className="max-w-md">
        <h1 className="text-3xl font-semibold">Staff access required</h1>
        <p className="mt-4 leading-7">You are signed in as {user.email}, but this account does not have access to Warren’s workspace. Contact your administrator.</p>
        <form action={signOut}><button className="mt-6 rounded-md bg-[#17130f] px-5 py-3 font-medium text-white">Sign out</button></form>
      </section>
    </main>
  );
}
