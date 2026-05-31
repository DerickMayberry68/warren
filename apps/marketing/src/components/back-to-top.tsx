"use client";

import { ArrowUp } from "lucide-react";
import { useEffect, useState } from "react";

export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const updateVisibility = () => {
      setVisible(window.scrollY > 520);
    };

    updateVisibility();
    window.addEventListener("scroll", updateVisibility, { passive: true });

    return () => {
      window.removeEventListener("scroll", updateVisibility);
    };
  }, []);

  return (
    <button
      aria-label="Return to top"
      className={`fixed bottom-5 right-5 z-40 inline-flex size-12 items-center justify-center rounded-md border border-[#d9762a]/45 bg-[#17130f] text-[#f7f0e2] shadow-[0_18px_40px_rgba(23,19,15,0.28)] transition hover:bg-[#d9762a] hover:text-[#17130f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d9762a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f4efe5] ${
        visible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-3 opacity-0"
      }`}
      onClick={() => window.scrollTo({ behavior: "smooth", top: 0 })}
      type="button"
    >
      <ArrowUp className="size-5" />
    </button>
  );
}
