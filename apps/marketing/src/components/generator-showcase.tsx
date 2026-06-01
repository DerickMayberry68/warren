"use client";

import { ArrowRight } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { ContactModal } from "@/components/contact-modal";

const generatorProducts = [
  {
    alt: "Generac home standby generator",
    image: "/images/generators/standby-generator.png",
    label: "Generac standby",
    text: "Whole-home backup power for outages, storms, and long rural utility interruptions.",
  },
  {
    alt: "Generac portable generator",
    image: "/images/generators/portable-generator.png",
    label: "Portable power",
    text: "Jobsite and emergency power that can move with the work.",
  },
  {
    alt: "Generator installation support",
    image: "/images/generators/generator-installation.png",
    label: "Install support",
    text: "A practical path from product questions to installed equipment.",
  },
  {
    alt: "Generator service work",
    image: "/images/generators/generator-service.png",
    label: "Service after sale",
    text: "Maintenance, parts, and repair support from the same local shop.",
  },
];

export function GeneratorShowcase() {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeProduct = generatorProducts[activeIndex];

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % generatorProducts.length);
    }, 4200);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <div className="relative min-h-[520px] overflow-hidden rounded-lg border border-[#f7f0e2]/12 bg-[#17130f] shadow-[0_24px_80px_rgba(0,0,0,0.26)]">
      <Image
        alt="Generator service bay background"
        className="object-cover"
        fill
        sizes="(min-width: 1024px) 50vw, 100vw"
        src="/images/generators/generac-service-bay.png"
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(23,19,15,0.94)_0%,rgba(23,19,15,0.78)_42%,rgba(23,19,15,0.34)_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(23,19,15,0.06)_0%,rgba(23,19,15,0.84)_100%)]" />

      <div className="relative flex min-h-[520px] flex-col justify-between p-5 sm:p-6">
        <div className="max-w-sm">
          <p className="font-mono text-xs font-bold uppercase tracking-[0.24em] text-[#d7a15b]">
            Generac dealer support
          </p>
          <h3 className="mt-4 text-3xl font-semibold leading-tight text-[#f7f0e2]">
            Backup power with local service behind it.
          </h3>
        </div>

        <div className="grid items-end gap-6 lg:grid-cols-[1fr_0.82fr]">
          <div className="relative min-h-[260px]">
            {generatorProducts.map((product, index) => (
              <div
                aria-hidden={activeIndex !== index}
                className={`absolute inset-0 flex items-end justify-center transition duration-700 ${
                  activeIndex === index
                    ? "translate-y-0 opacity-100"
                    : "translate-y-4 opacity-0"
                }`}
                key={product.label}
              >
                <Image
                  alt={product.alt}
                  className="max-h-[250px] w-auto object-contain drop-shadow-[0_22px_28px_rgba(0,0,0,0.55)]"
                  height={330}
                  priority={index === 0}
                  src={product.image}
                  width={430}
                />
              </div>
            ))}
          </div>

          <div className="rounded-lg border border-[#f7f0e2]/12 bg-[#17130f]/78 p-5 backdrop-blur-sm">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#d7a15b]">
              {activeProduct.label}
            </p>
            <p className="mt-3 min-h-14 leading-7 text-[#f7f0e2]/76">
              {activeProduct.text}
            </p>
            <div className="mt-5 flex items-center gap-2">
              {generatorProducts.map((product, index) => (
                <button
                  aria-label={`Show ${product.label}`}
                  className={`h-2.5 rounded-full transition-all ${
                    activeIndex === index
                      ? "w-8 bg-[#d9762a]"
                      : "w-2.5 bg-[#f7f0e2]/34 hover:bg-[#f7f0e2]/62"
                  }`}
                  key={product.label}
                  onClick={() => setActiveIndex(index)}
                  type="button"
                />
              ))}
            </div>
            <ContactModal
              className="mt-6 h-10 px-4"
              label="Ask about Generac"
              tone="outline"
            />
          </div>
        </div>
      </div>

      <ArrowRight className="absolute right-5 top-5 size-5 text-[#d7a15b]" />
    </div>
  );
}
