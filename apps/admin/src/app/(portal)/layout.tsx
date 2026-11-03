import { Suspense } from "react";
import { requireStaff } from "@/lib/auth";
import { PortalShell } from "@/components/portal-shell";

export default async function PortalLayout({children}:{children:React.ReactNode}) {
  const {user}=await requireStaff();
  const name=[user.user_metadata.first_name,user.user_metadata.last_name].filter(value=>typeof value==="string"&&value).join(" ");
  return <Suspense fallback={<div className="min-h-screen bg-[#f4efe5] p-8">Loading workspace…</div>}><PortalShell email={user.email??""} name={name} role={user.app_metadata.role}>{children}</PortalShell></Suspense>;
}
