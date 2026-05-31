"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import { ArrowRight, Loader2, X } from "lucide-react";
import {
  type ContactActionState,
  submitContact,
} from "@/app/actions";

const initialState: ContactActionState = {
  ok: false,
  message: "",
};

const services = [
  "Welding or fabrication",
  "Portable welding",
  "Trailer, truck, or implement repair",
  "Generator inquiry",
  "Parts and service",
  "DewEze or Deutz equipment",
];

type ContactModalProps = {
  className?: string;
  label: string;
  tone?: "solid" | "outline" | "dark";
};

const tones = {
  solid:
    "bg-[#d9762a] text-[#17130f] hover:bg-[#ee9a4d]",
  outline:
    "border border-[#f7f0e2]/28 text-[#f7f0e2] hover:border-[#f7f0e2]/60 hover:bg-[#f7f0e2]/8",
  dark:
    "bg-[#17130f] text-[#f7f0e2] hover:bg-[#2a2119]",
};

export function ContactModal({
  className = "",
  label,
  tone = "solid",
}: ContactModalProps) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    submitContact,
    initialState,
  );
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);
    closeRef.current?.focus();

    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <>
      <button
        className={`inline-flex h-12 items-center justify-center gap-2 rounded-md px-5 text-sm font-bold transition ${tones[tone]} ${className}`}
        onClick={() => setOpen(true)}
        type="button"
      >
        {label}
        <ArrowRight className="size-4" />
      </button>

      {open ? (
        <div
          aria-labelledby={titleId}
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#17130f]/78 p-4 backdrop-blur-sm"
          role="dialog"
        >
          <button
            aria-label="Close contact form"
            className="absolute inset-0 cursor-default"
            onClick={() => setOpen(false)}
            type="button"
          />
          <div className="relative max-h-[92svh] w-full max-w-2xl overflow-y-auto rounded-lg border border-[#f7f0e2]/16 bg-[#f4efe5] text-[#17130f] shadow-2xl">
            <div className="flex items-start justify-between border-b border-[#2a2119]/12 p-5 sm:p-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#8f3f21]">
                  Warren Welding
                </p>
                <h2 className="mt-2 text-2xl font-semibold" id={titleId}>
                  Start a shop request
                </h2>
              </div>
              <button
                aria-label="Close contact form"
                className="rounded-md p-2 text-[#5d5147] transition hover:bg-[#2a2119]/8 hover:text-[#17130f]"
                onClick={() => setOpen(false)}
                ref={closeRef}
                type="button"
              >
                <X className="size-5" />
              </button>
            </div>

            <form action={formAction} className="grid gap-5 p-5 sm:p-6">
              <input
                autoComplete="organization"
                className="hidden"
                name="company"
                tabIndex={-1}
                type="text"
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2 text-sm font-semibold">
                  Name
                  <input
                    autoComplete="name"
                    className="h-11 rounded-md border border-[#2a2119]/16 bg-white px-3 font-normal outline-none transition focus:border-[#8f3f21] focus:ring-2 focus:ring-[#d9762a]/25"
                    name="name"
                    required
                    type="text"
                  />
                </label>
                <label className="grid gap-2 text-sm font-semibold">
                  Email
                  <input
                    autoComplete="email"
                    className="h-11 rounded-md border border-[#2a2119]/16 bg-white px-3 font-normal outline-none transition focus:border-[#8f3f21] focus:ring-2 focus:ring-[#d9762a]/25"
                    name="email"
                    required
                    type="email"
                  />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2 text-sm font-semibold">
                  Phone
                  <input
                    autoComplete="tel"
                    className="h-11 rounded-md border border-[#2a2119]/16 bg-white px-3 font-normal outline-none transition focus:border-[#8f3f21] focus:ring-2 focus:ring-[#d9762a]/25"
                    name="phone"
                    type="tel"
                  />
                </label>
                <label className="grid gap-2 text-sm font-semibold">
                  Service
                  <select
                    className="h-11 rounded-md border border-[#2a2119]/16 bg-white px-3 font-normal outline-none transition focus:border-[#8f3f21] focus:ring-2 focus:ring-[#d9762a]/25"
                    name="service"
                  >
                    {services.map((service) => (
                      <option key={service}>{service}</option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="grid gap-2 text-sm font-semibold">
                What do you need handled?
                <textarea
                  className="min-h-32 rounded-md border border-[#2a2119]/16 bg-white p-3 font-normal outline-none transition focus:border-[#8f3f21] focus:ring-2 focus:ring-[#d9762a]/25"
                  name="message"
                  required
                />
              </label>

              {state.message ? (
                <p
                  className={`rounded-md border p-3 text-sm ${
                    state.ok
                      ? "border-green-700/20 bg-green-700/10 text-green-900"
                      : "border-[#8f3f21]/20 bg-[#d9762a]/12 text-[#6f2f19]"
                  }`}
                >
                  {state.message}
                </p>
              ) : null}

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-[#6a5b50]">
                  Prefer the phone? Call (870) 423-2037.
                </p>
                <button
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[#17130f] px-5 text-sm font-bold text-[#f7f0e2] transition hover:bg-[#2a2119] disabled:cursor-not-allowed disabled:opacity-65"
                  disabled={pending}
                  type="submit"
                >
                  {pending ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Saving
                    </>
                  ) : (
                    "Send request"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
