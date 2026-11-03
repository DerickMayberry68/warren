"use client";

import { useActionState, useState } from "react";
import { saveJob, saveBooking, finishBooking, type ScheduleState } from "./actions";
import { statuses, centralInput, centralToday, type Job, type Booking, type CrewMember } from "@/lib/scheduling";

const input="min-w-0 w-full rounded-md border border-[#2a2119]/25 bg-white px-3 py-2.5 text-[#17130f] focus-visible:outline-2 focus-visible:outline-[#8f3f21]";
const button="rounded-md bg-[#17130f] px-4 py-3 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-4 disabled:opacity-50";
function Result({state}:{state:ScheduleState}) { return <div aria-live="polite" className="mt-3 text-sm">{state.error && <p role="alert" className="rounded-md border border-[#8f3f21]/25 bg-[#8f3f21]/5 p-3 text-[#762f19]">{state.error}</p>}{state.message && <p className="rounded-md bg-green-800/10 p-3">{state.message}</p>}</div>; }
function Field({label,name,value,required=false,type="text",max=500}:{label:string;name:string;value?:string|null;required?:boolean;type?:string;max?:number}) { return <label className="grid min-w-0 gap-2 text-sm font-medium">{label}<input className={input} name={name} type={type} defaultValue={value??""} required={required} maxLength={max}/></label>; }

export function JobForm({job}:{job?:Job}) {
  const [state,action,pending]=useActionState(saveJob,{});
  return <form action={action} onReset={event=>event.preventDefault()} className="mt-5">
    <input type="hidden" name="id" value={job?.id??""}/>
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Job title" name="title" value={job?.title} required max={160}/><Field label="Customer name" name="customer_name" value={job?.customer_name} required max={160}/>
      <Field label="Customer email" name="customer_email" type="email" value={job?.customer_email} max={254}/><Field label="Customer phone" name="customer_phone" type="tel" value={job?.customer_phone} max={40}/>
      <Field label="Equipment / model / serial" name="equipment" value={job?.equipment}/><Field label="Address / shop location" name="location" value={job?.location}/>
      <label className="grid gap-2 text-sm font-medium">Job progress<select name="status" className={input} defaultValue={job?.status??"new"}>{Object.entries(statuses).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
      <label className="grid gap-2 text-sm font-medium">Priority<select name="priority" className={input} defaultValue={job?.priority??"normal"}><option value="normal">Normal</option><option value="urgent">Urgent</option></select></label>
      <Field label="Requested due date" name="due_date" type="date" value={job?.due_date}/><Field label="Blocker / waiting on" name="blocker" value={job?.blocker} max={300}/>
    </div>
    <label className="mt-4 grid gap-2 text-sm font-medium">Job instructions<textarea name="instructions" defaultValue={job?.instructions??""} maxLength={5000} rows={3} className={input}/></label>
    <button disabled={pending} className={`${button} mt-5`}>{pending?"Saving…":job?"Save job":"Create job"}</button><Result state={state}/>
  </form>;
}

export function BookingForm({job,crew,booking,assigned=[]}:{job:Job;crew:CrewMember[];booking?:Booking;assigned?:string[]}) {
  const [kind,setKind]=useState(booking?.kind??"field");
  const [state,action,pending]=useActionState(saveBooking,{});
  return <form action={action} onReset={event=>event.preventDefault()} className="mt-5">
    <input type="hidden" name="id" value={booking?.id??""}/><input type="hidden" name="job_id" value={job.id}/>
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="grid gap-2 text-sm font-medium">Booking type<select name="kind" className={input} value={kind} onChange={e=>setKind(e.target.value)}><option value="field">Field visit · timed</option><option value="shop">Shop work · flexible days</option></select></label>
      <Field label="Booking location" name="location" value={state.values?.location??booking?.location??job.location}/>
      {kind==="field" ? <><Field label="Start · Central Time" name="start_at" type="datetime-local" value={state.values?.start_at??(booking?.start_at?centralInput(booking.start_at):"")} required/><Field label="End · Central Time" name="end_at" type="datetime-local" value={state.values?.end_at??(booking?.end_at?centralInput(booking.end_at):"")} required/></> : <><Field label="First shop day" name="start_day" type="date" value={state.values?.start_day??booking?.start_day??centralToday()} required/><Field label="Last shop day (inclusive)" name="end_day" type="date" value={state.values?.end_day??booking?.end_day??centralToday()} required/></>}
    </div>
    <fieldset className="mt-5 rounded-md border border-[#2a2119]/20 p-4"><legend className="px-2 text-sm font-semibold">Assigned crew</legend><div className="grid gap-3 sm:grid-cols-2">{crew.map(person=><label key={person.id} className="flex items-center gap-3 text-sm"><input type="checkbox" name="staff" value={person.id} defaultChecked={(state.staff??assigned).includes(person.id)} className="size-4"/>{person.name}</label>)}</div></fieldset>
    <label className="mt-4 grid gap-2 text-sm font-medium">Lead person<select name="lead" className={input} defaultValue={state.values?.lead??booking?.lead_id??""} required><option value="">Choose someone in the assigned crew</option>{crew.map(person=><option key={person.id} value={person.id}>{person.name}</option>)}</select></label>
    <label className="mt-4 grid gap-2 text-sm font-medium">Visit instructions<textarea name="instructions" maxLength={2000} defaultValue={state.values?.instructions??booking?.instructions??""} className={input} rows={2}/></label>
    <label className="mt-4 flex items-start gap-3 text-sm"><input className="mt-1 size-4 shrink-0" name="override" type="checkbox" defaultChecked={state.values?.override==="on"}/>Allow overlapping crew assignments. Flexible shop days reserve the whole day for this warning.</label>
    <button disabled={pending} className={`${button} mt-5`}>{pending?"Saving…":booking?"Save booking":"Add booking"}</button><Result state={state}/>
  </form>;
}

export function BookingStatusForm({booking}:{booking:Booking}) {
  const [state,action,pending]=useActionState(finishBooking,{});
  return <form action={action} className="mt-4"><input type="hidden" name="id" value={booking.id}/><input type="hidden" name="job_id" value={booking.job_id}/><div className="flex flex-wrap items-center gap-3"><label className="grid gap-2 text-sm">Booking outcome<select className={input} name="status"><option value="completed">Visit completed</option><option value="cancelled">Cancel booking</option></select></label><button className={button} disabled={pending}>{pending?"Saving…":"Save outcome"}</button></div><Result state={state}/></form>;
}
