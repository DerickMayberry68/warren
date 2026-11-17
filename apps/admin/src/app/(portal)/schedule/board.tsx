"use client";

import Link from "next/link";
import { useOptimistic, useState, useTransition } from "react";
import { moveJob } from "./actions";
import { statuses } from "@/lib/scheduling";

type BoardJob = { id: string; job_number: number; title: string; customer_name: string; status: string; priority: string; blocker: string; due_date: string | null };
type Status = keyof typeof statuses;

export function ShopBoard({ jobs, canEdit }: { jobs: BoardJob[]; canEdit: boolean }) {
  const [board, applyMove] = useOptimistic(jobs, (current, move: { id: string; to: string }) => current.map(job => job.id === move.id ? { ...job, status: move.to } : job));
  const [, startTransition] = useTransition();
  const [dragging, setDragging] = useState<string | null>(null);
  const [over, setOver] = useState<string | null>(null);
  const [result, setResult] = useState<{ error?: string; message?: string }>({});

  function move(id: string, to: string) {
    const job = board.find(item => item.id === id);
    if (!job || job.status === to) return;
    setResult({});
    startTransition(async () => {
      applyMove({ id, to });
      setResult(await moveJob(id, job.status, to));
    });
  }

  return <section className="mt-8" aria-label="Shop board">
    <div aria-live="polite" className="text-sm">
      {result.error && <p role="alert" className="mb-4 rounded-md border border-[#8f3f21]/25 bg-[#8f3f21]/5 p-3 text-[#762f19]">{result.error}</p>}
      {result.message && <p className="mb-4 rounded-md bg-green-800/10 p-3">{result.message}</p>}
    </div>
    {canEdit && <p className="mb-4 text-sm text-[#6a5b50]">Drag a card to another column to change its progress, or use the “Move to” menu on the card.</p>}
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {(Object.entries(statuses) as [Status, string][]).map(([value, label]) => {
        const items = board.filter(job => job.status === value);
        const target = canEdit && dragging !== null && over === value;
        return <section key={value} aria-label={label}
          onDragOver={canEdit ? event => { if (!dragging) return; event.preventDefault(); event.dataTransfer.dropEffect = "move"; setOver(value); } : undefined}
          onDragLeave={canEdit ? event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOver(current => current === value ? null : current); } : undefined}
          onDrop={canEdit ? event => { event.preventDefault(); const id = event.dataTransfer.getData("text/plain"); setDragging(null); setOver(null); if (id) move(id, value); } : undefined}
          className={`min-h-40 rounded-lg border bg-[#fffaf0] p-4 transition-colors ${target ? "border-[#8f3f21] bg-[#f4e6d4]" : "border-[#2a2119]/15"}`}>
          <h2 className="font-semibold">{label} <span className="text-[#6a5b50]">({items.length})</span></h2>
          <div className="mt-4 grid gap-3">
            {items.map(job => <BoardCard key={job.id} job={job} canEdit={canEdit} dragging={dragging === job.id}
              onDragStart={id => setDragging(id)} onDragEnd={() => { setDragging(null); setOver(null); }} onMove={to => move(job.id, to)} />)}
            {!items.length && <p className={`rounded-md border border-dashed p-4 text-center text-sm text-[#6a5b50] ${target ? "border-[#8f3f21]" : "border-[#2a2119]/20"}`}>{canEdit && dragging ? "Drop here" : "No jobs"}</p>}
          </div>
        </section>;
      })}
    </div>
  </section>;
}

function BoardCard({ job, canEdit, dragging, onDragStart, onDragEnd, onMove }: { job: BoardJob; canEdit: boolean; dragging: boolean; onDragStart: (id: string) => void; onDragEnd: () => void; onMove: (to: string) => void }) {
  return <div draggable={canEdit}
    onDragStart={canEdit ? event => { event.dataTransfer.setData("text/plain", job.id); event.dataTransfer.effectAllowed = "move"; onDragStart(job.id); } : undefined}
    onDragEnd={canEdit ? onDragEnd : undefined}
    className={`rounded-md border bg-[#fffaf0] shadow-sm ${job.priority === "urgent" ? "border-l-4 border-[#a43c26]" : "border-[#2a2119]/15"} ${canEdit ? "cursor-grab active:cursor-grabbing" : ""} ${dragging ? "opacity-40" : ""}`}>
    <Link href={`/schedule/jobs/${job.id}`} draggable={false} className="block p-4 focus-visible:outline-2 focus-visible:outline-offset-2">
      <span className="text-xs text-[#6a5b50]">#{job.job_number}{job.priority === "urgent" ? " · URGENT" : ""}</span>
      <strong className="mt-2 block">{job.title}</strong>
      <span className="mt-1 block text-sm">{job.customer_name}</span>
      {job.due_date && <span className="mt-2 block text-xs">Due {job.due_date}</span>}
      {job.blocker && <span className="mt-2 block rounded bg-[#a46c23]/10 p-2 text-xs">Waiting on: {job.blocker}</span>}
    </Link>
    {canEdit && <label className="flex items-center gap-2 border-t border-[#2a2119]/10 px-4 py-2 text-xs text-[#6a5b50]">Move to
      <select value={job.status} onChange={event => onMove(event.target.value)} aria-label={`Move job #${job.job_number} to`}
        className="min-w-0 flex-1 rounded border border-[#2a2119]/25 bg-white px-2 py-1 text-[#17130f] focus-visible:outline-2 focus-visible:outline-[#8f3f21]">
        {Object.entries(statuses).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </select>
    </label>}
  </div>;
}
