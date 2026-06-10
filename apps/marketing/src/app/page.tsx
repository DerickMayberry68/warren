import {
  ArrowRight,
  Factory,
  Flame,
  MapPin,
  Phone,
  ShieldCheck,
  Truck,
  Wrench,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { BackToTop } from "@/components/back-to-top";
import { ContactModal } from "@/components/contact-modal";
import { GeneratorShowcase } from "@/components/generator-showcase";
import { HeroBackgroundRotator } from "@/components/hero-background-rotator";
import { WarrenLogo } from "@/components/warren-logo";

const services = [
  {
    icon: Flame,
    title: "In-shop welding",
    text: "Clean, practical fabrication and repair work handled by people who know how metal behaves under heat.",
  },
  {
    icon: Truck,
    title: "Portable welding",
    text: "Field-capable welding for equipment that cannot wait on a trailer ride back to town.",
  },
  {
    icon: Wrench,
    title: "Trailer, truck & implement repair",
    text: "Farm, ranch, and work-truck repairs built around strength, fit, and everyday use.",
  },
  {
    icon: Zap,
    title: "Generators & power units",
    text: "Generator service, power-unit support, and practical guidance for dependable backup power.",
  },
];

const proofPoints = [
  "DewEze equipment",
  "Deutz power units",
  "Parts and service",
  "Affordable repair work",
];

export default function Home() {
  return (
    <main className="bg-[#f4efe5] text-[#17130f]">
      <section className="relative min-h-[92svh] overflow-hidden bg-[#15110e] text-[#f7f0e2]">
        <HeroBackgroundRotator />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(16,13,11,0.94)_0%,rgba(16,13,11,0.82)_34%,rgba(16,13,11,0.28)_68%,rgba(16,13,11,0.54)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-28 bg-[linear-gradient(180deg,rgba(21,17,14,0)_0%,#15110e_92%)]" />

        <div className="relative mx-auto flex min-h-[92svh] w-full flex-col px-[2vw] py-5">
          <header className="flex items-center justify-between border-b border-[#f7f0e2]/12 pb-4">
            <Link
              aria-label="Warren Welding and Generators home"
              className="block"
              href="/"
            >
              <WarrenLogo className="h-14 w-[220px]" />
            </Link>
            <nav className="hidden items-center gap-8 text-sm font-medium text-[#f7f0e2]/74 md:flex">
              <a className="transition hover:text-[#f7f0e2]" href="#services">
                Services
              </a>
              <a className="transition hover:text-[#f7f0e2]" href="#generators">
                Generators
              </a>
              <a className="transition hover:text-[#f7f0e2]" href="#contact">
                Contact
              </a>
            </nav>
            <ContactModal
              className="h-10 px-3"
              label="Request contact"
              tone="outline"
            />
          </header>

          <div className="grid flex-1 items-end pb-14 pt-16 lg:grid-cols-[minmax(0,0.98fr)_minmax(340px,0.52fr)] lg:gap-12">
            <div className="max-w-4xl">
              <div className="mb-6 inline-flex items-center gap-3 border-y border-[#d7a15b]/35 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-[#d7a15b]">
                <span>Berryville, Arkansas</span>
                <span className="h-px w-8 bg-[#d7a15b]/60" />
                <span>Family trade</span>
              </div>
              <h1 className="max-w-4xl text-5xl font-semibold leading-[0.98] tracking-normal text-balance sm:text-7xl lg:text-8xl">
                You dream it. We&apos;ll build it.
              </h1>
              <p className="mt-7 max-w-2xl text-lg leading-8 text-[#f7f0e2]/76 sm:text-xl">
                In-shop and portable welding, fabrication, truck and implement
                repair, generators, power units, parts, and service from a shop
                that still answers the phone.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <ContactModal label="Start a request" />
                <a
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-[#f7f0e2]/28 px-5 text-sm font-bold text-[#f7f0e2] transition hover:border-[#f7f0e2]/60 hover:bg-[#f7f0e2]/8"
                  href="#services"
                >
                  See what we handle
                  <ArrowRight className="size-4" />
                </a>
              </div>
            </div>

            <div className="mt-12 border-l border-[#f7f0e2]/14 pl-5 text-sm text-[#f7f0e2]/72 lg:mt-0">
              <p className="font-mono text-xs uppercase tracking-[0.22em] text-[#d7a15b]">
                Shop note
              </p>
              <p className="mt-4 max-w-sm text-pretty text-lg leading-8">
                The work is practical: hay beds, power units, ranch equipment,
                trailers, trucks, and repairs that have to hold.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-[#2a2119]/10 bg-[#15110e] px-[2vw] py-5 text-[#f7f0e2]">
        <div className="mx-auto grid gap-3 text-sm font-semibold uppercase tracking-[0.18em] text-[#f7f0e2]/70 sm:grid-cols-2 lg:grid-cols-4">
          {proofPoints.map((point) => (
            <div className="flex items-center gap-3" key={point}>
              <ShieldCheck className="size-4 text-[#d9762a]" />
              {point}
            </div>
          ))}
        </div>
      </section>

      <section
        className="bg-[#f4efe5] px-[2vw] py-20"
        id="services"
      >
        <div className="mx-auto">
          <div className="grid gap-8 lg:grid-cols-[0.62fr_1fr] lg:items-end">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#8f3f21]">
                What the shop handles
              </p>
              <h2 className="mt-4 text-4xl font-semibold leading-tight text-balance sm:text-5xl">
                Repair, fabrication, and field work for equipment that has to
                hold.
              </h2>
            </div>
            <p className="max-w-3xl text-lg leading-8 text-[#5d5147]">
              In-shop and portable welding, trailer, truck, and implement
              repairs, DewEze and Deutz equipment, plus a parts and service
              center for the work that keeps farms, crews, and equipment moving.
            </p>
          </div>

          <div className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {services.map((service) => {
              const Icon = service.icon;

              return (
                <article
                  className="rounded-lg border border-[#2a2119]/12 bg-[#fffaf0] p-6 shadow-[0_18px_55px_rgba(42,33,25,0.08)]"
                  key={service.title}
                >
                  <div className="mb-8 flex size-11 items-center justify-center rounded-md bg-[#17130f] text-[#d9762a]">
                    <Icon className="size-5" />
                  </div>
                  <h3 className="text-xl font-semibold">{service.title}</h3>
                  <p className="mt-4 leading-7 text-[#6a5b50]">
                    {service.text}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section
        className="bg-[#251c17] px-[2vw] py-20 text-[#f7f0e2]"
        id="generators"
      >
        <div className="mx-auto grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#d7a15b]">
              Generac generators & equipment
            </p>
            <h2 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight text-balance sm:text-5xl">
              Backup power, hay, and equipment support under one roof.
            </h2>
            <div className="mt-8 grid gap-5 text-[#f7f0e2]/74 sm:grid-cols-2">
              <div className="border-t border-[#f7f0e2]/16 pt-5">
                <Factory className="mb-4 size-5 text-[#d9762a]" />
                <h3 className="font-semibold text-[#f7f0e2]">
                  Deutz power units
                </h3>
                <p className="mt-3 leading-7">
                  Diesel engine and power-unit work for customers who need
                  durability more than decoration.
                </p>
              </div>
              <div className="border-t border-[#f7f0e2]/16 pt-5">
                <Truck className="mb-4 size-5 text-[#d9762a]" />
                <h3 className="font-semibold text-[#f7f0e2]">
                  DewEze equipment
                </h3>
                <p className="mt-3 leading-7">
                  Hay handling equipment, flat beds, installation, parts, and
                  service after the sale.
                </p>
              </div>
              <div className="border-t border-[#f7f0e2]/16 pt-5">
                <Zap className="mb-4 size-5 text-[#d9762a]" />
                <h3 className="font-semibold text-[#f7f0e2]">
                  Generac standby generators
                </h3>
                <p className="mt-3 leading-7">
                  Backup-power support from a local shop that knows equipment,
                  service, and what dependable power has to do.
                </p>
              </div>
              <div className="border-t border-[#f7f0e2]/16 pt-5">
                <Wrench className="mb-4 size-5 text-[#d9762a]" />
                <h3 className="font-semibold text-[#f7f0e2]">
                  Parts & service
                </h3>
                <p className="mt-3 leading-7">
                  Repairs, replacement parts, and maintenance from the same
                  people who install the equipment.
                </p>
              </div>
            </div>
          </div>

          <GeneratorShowcase />
        </div>
      </section>

      <section className="bg-[#f4efe5] px-[2vw] py-20">
        <div className="mx-auto grid gap-10 lg:grid-cols-[0.78fr_1fr] lg:items-start">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#8f3f21]">
              A generational trade
            </p>
            <h2 className="mt-4 text-4xl font-semibold leading-tight text-balance sm:text-5xl">
              Built for hard work, backed by honest service.
            </h2>
          </div>
          <div className="grid gap-6 text-lg leading-8 text-[#5d5147]">
            <p>
              Every job gets practical attention from people who know the
              difference between good enough and built to last.
            </p>
            <p>
              From fabrication and repair to generators, power units, equipment,
              and parts, Warren Welding keeps the work straightforward and close
              to home.
            </p>
          </div>
        </div>
      </section>

      <section
        className="bg-[#17130f] px-[2vw] py-16 text-[#f7f0e2]"
        id="contact"
      >
        <div className="mx-auto grid gap-8 lg:grid-cols-[1fr_0.72fr] lg:items-center">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#d7a15b]">
              Contact Warren Welding
            </p>
            <h2 className="mt-4 text-4xl font-semibold leading-tight text-balance sm:text-5xl">
              Have a repair, build, or power question?
            </h2>
          </div>
          <div className="rounded-lg border border-[#f7f0e2]/14 bg-[#f7f0e2]/6 p-6">
            <a
              className="flex items-center gap-3 text-2xl font-semibold"
              href="tel:+18704232037"
            >
              <Phone className="size-5 text-[#d9762a]" />
              (870) 423-2037
            </a>
            <a
              className="mt-4 flex items-start gap-3 leading-7 text-[#f7f0e2]/72"
              href="https://www.google.com/maps/search/?api=1&query=227+Apricot+Lane+Berryville+AR+72616"
            >
              <MapPin className="mt-1 size-5 shrink-0 text-[#d9762a]" />
              <span>
                227 Apricot Lane
                <br />
                Berryville, AR 72616
              </span>
            </a>
            <ContactModal className="mt-6 h-11" label="Send a request" />
          </div>
        </div>
      </section>
      <BackToTop />
    </main>
  );
}
