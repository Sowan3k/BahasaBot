"use client";

import Image from "next/image";

const ROW_A = [
  { src: "/showcase/showcase-1.svg",  label: "KL Skyline" },
  { src: "/showcase/showcase-2.svg",  label: "Malaysian Cuisine" },
  { src: "/showcase/showcase-3.svg",  label: "Cultural Festivals" },
  { src: "/showcase/showcase-4.svg",  label: "Student Life" },
  { src: "/showcase/showcase-9.svg",  label: "Vocabulary" },
  { src: "/showcase/showcase-10.svg", label: "AI Tutor Chat" },
  { src: "/showcase/showcase-13.svg", label: "Penang Bridge" },
];

const ROW_B = [
  { src: "/showcase/showcase-5.svg",  label: "Classroom Malay" },
  { src: "/showcase/showcase-6.svg",  label: "Night Market" },
  { src: "/showcase/showcase-7.svg",  label: "Kampung Village" },
  { src: "/showcase/showcase-8.svg",  label: "Georgetown" },
  { src: "/showcase/showcase-11.svg", label: "BPS Achievement" },
  { src: "/showcase/showcase-12.svg", label: "Learning Journey" },
  { src: "/showcase/showcase-14.svg", label: "Graduation Day" },
];

const MASK = "linear-gradient(90deg, transparent 0%, black 12%, black 88%, transparent 100%)";

function ScrollRow({
  items,
  direction,
  duration,
}: {
  items: { src: string; label: string }[];
  direction: "left" | "right";
  duration: number;
}) {
  const doubled = [...items, ...items];
  const anim =
    direction === "left" ? "showcaseScrollLeft" : "showcaseScrollRight";

  return (
    <div
      className="flex-1 min-h-0 overflow-hidden"
      style={{ maskImage: MASK, WebkitMaskImage: MASK }}
    >
      <div
        className="flex gap-3 h-full w-max"
        style={{ animation: `${anim} ${duration}s linear infinite` }}
      >
        {doubled.map((item, i) => (
          <div
            key={i}
            className="flex-shrink-0 h-full rounded-xl overflow-hidden
                       border border-white/[0.08] bg-white/[0.03] relative group"
            style={{ aspectRatio: "1 / 1" }}
          >
            <Image
              src={item.src}
              alt={item.label}
              fill
              sizes="160px"
              className="object-contain p-1 transition-transform duration-700 group-hover:scale-105"
              draggable={false}
              unoptimized
            />
            <div
              className="absolute inset-x-0 bottom-0 h-7 flex items-end px-2 pb-1.5"
              style={{
                background:
                  "linear-gradient(to top, rgba(0,0,0,0.75), transparent)",
              }}
            >
              <span className="text-white/55 text-[9px] font-medium truncate leading-none">
                {item.label}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CourseShowcase() {
  return (
    <div className="w-full h-full flex flex-col gap-2.5">
      <ScrollRow items={ROW_A} direction="left" duration={38} />
      <ScrollRow items={ROW_B} direction="right" duration={48} />
    </div>
  );
}
