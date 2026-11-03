"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { CalendarDays, Columns3, ClipboardList, ExternalLink, LayoutDashboard, LogOut, Mail, Menu, Settings, Users, Wrench, X } from "lucide-react";
import { useState } from "react";
import { signOut } from "@/app/login/actions";

const sections = [
  { label: "Overview", items: [{ label: "Dashboard", href: "/", icon: LayoutDashboard }] },
  { label: "Shop operations", items: [
    { label: "Schedule", href: "/schedule", icon: CalendarDays },
    { label: "Shop board", href: "/schedule?view=board", icon: Columns3 },
    { label: "Jobs", href: "/schedule?view=jobs", icon: ClipboardList },
  ] },
  { label: "Office", items: [
    { label: "Contact requests", href: "/leads", icon: Mail },
    { label: "Staff & access", href: "/staff", icon: Users, admin: true },
  ] },
  { label: "Account", items: [{ label: "Password settings", href: "/set-password", icon: Settings }] },
];

export function PortalShell({children,email,name,role}:{children:React.ReactNode;email:string;name:string;role:string}) {
  const path=usePathname(); const search=useSearchParams(); const [open,setOpen]=useState(false);
  const active=path==="/schedule" ? search.get("view")==="board"?"/schedule?view=board":search.get("view")==="jobs"?"/schedule?view=jobs":"/schedule" : path.startsWith("/schedule/jobs/")?"/schedule?view=jobs":path;
  const groups=sections.map(section=>({...section,items:section.items.filter(item=>!("admin" in item && item.admin)||role==="admin")}));
  const current=groups.flatMap(group=>group.items).find(item=>item.href===active);
  return <div className="portal-shell">
    <a href="#workspace-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-white focus:p-3">Skip to page content</a>
    {open&&<button type="button" className="portal-backdrop" aria-label="Close navigation" onClick={()=>setOpen(false)}/>}
    <aside className={`portal-sidebar ${open?"is-open":""}`} aria-label="Workspace sidebar">
      <div className="portal-brand-row"><Link href="/" onClick={()=>setOpen(false)} className="portal-brand"><span className="portal-brand-name">WARREN</span><span className="portal-brand-detail">WELDING &amp; GENERATORS</span><span className="portal-brand-workspace">Staff workspace</span></Link><button type="button" className="portal-mobile-close" aria-label="Close navigation" onClick={()=>setOpen(false)}><X size={20}/></button></div>
      <nav aria-label="Primary navigation" className="portal-navigation">{groups.map(group=><section key={group.label}><h2>{group.label}</h2><div>{group.items.map(item=><Link key={item.href} href={item.href} onClick={()=>setOpen(false)} aria-current={active===item.href?"page":undefined} className={`portal-nav-link ${active===item.href?"is-active":""}`}><item.icon size={18} aria-hidden="true"/><span>{item.label}</span></Link>)}</div></section>)}</nav>
      <div className="portal-sidebar-bottom"><Wrench size={16} aria-hidden="true"/><span>Shop work. Field work.<br/>One place to keep it moving.</span></div>
    </aside>
    <div className="portal-workspace">
      <header className="portal-topbar">
        <div className="flex min-w-0 items-center gap-3"><button type="button" className="portal-menu-button" aria-label="Open navigation" aria-expanded={open} onClick={()=>setOpen(true)}><Menu size={20}/></button><div><p className="portal-eyebrow">Warren workspace</p><p className="portal-section-title">{current?.label??"Workspace"}</p></div></div>
        <div className="portal-topbar-actions"><a href="https://warren-marketing.vercel.app/" target="_blank" rel="noopener noreferrer" className="portal-website-link"><ExternalLink size={15} aria-hidden="true"/><span>View website</span></a><div className="portal-user"><span className="portal-user-name" title={email}>{name||email}</span><span className="portal-user-role">{role==="admin"?"Administrator":"Staff"}</span></div><form action={signOut}><button type="submit" className="portal-signout" aria-label="Sign out" title="Sign out"><LogOut size={18}/><span>Sign out</span></button></form></div>
      </header>
      <main id="workspace-content" className="portal-content" tabIndex={-1}>{children}</main>
    </div>
  </div>;
}
