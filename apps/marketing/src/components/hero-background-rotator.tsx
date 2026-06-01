"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const heroImages = [
  {
    alt: "Welder working in a dark fabrication shop",
    src: "/images/welding-shop-hero.png",
  },
  {
    alt: "Generac generator equipment in a Warren service bay",
    src: "/images/generators/generac-service-bay.png",
  },
];

export function HeroBackgroundRotator() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % heroImages.length);
    }, 15000);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <>
      {heroImages.map((image, index) => (
        <Image
          alt={image.alt}
          className={`object-cover transition-opacity duration-1000 ${
            activeIndex === index ? "opacity-100" : "opacity-0"
          }`}
          fill
          key={image.src}
          priority={index === 0}
          sizes="100vw"
          src={image.src}
        />
      ))}
    </>
  );
}
