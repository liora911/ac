"use client";

import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import Image from "next/image";

const presentations = [
  {
    id: "qm-001",
    title: "Quantum Mechanics Insights",
    imageUrls: ["/consc.png", "/moon.png", "/qft.png"],
    description: "An overview of foundational concepts in quantum mechanics.",
    content: `
        Topics covered:
        - Wave-particle duality
        - Schrödinger's equation
        - Quantum entanglement
        - Measurement problem and decoherence
      `,
  },
  {
    id: "rel-002",
    title: "Exploring Relativity",
    imageUrls: ["/spacetime.png", "/schrodingercat.jpg"],
    description: "Delving into the theories of special and general relativity.",
    content: `
        Topics covered:
        - Lorentz transformations
        - Time dilation and length contraction
        - Spacetime curvature
        - Einstein field equations
      `,
  },
  {
    id: "bio-003",
    title: "Evolutionary Biology Today",
    imageUrls: ["/electroncloud.png", "/qftt.png"],
    description: "Current research and discussions in evolutionary biology.",
    content: `
        Topics covered:
        - Natural selection and adaptation
        - Genetic drift and gene flow
        - Phylogenetic trees and molecular evolution
        - Evo-Devo (evolutionary developmental biology)
      `,
  },
  {
    id: "mind-004",
    title: "Philosophy of Mind",
    imageUrls: ["/moon.png"],
    description: "Exploring consciousness and the nature of mind.",
    content: `
        Topics covered:
        - Dualism vs Physicalism
        - Intentionality and qualia
        - Neural correlates of consciousness
        - Panpsychism, emergence, and integrated information theory
      `,
  },
  {
    id: "test-001",
    title: "Yarin Test Presentation",
    imageUrls: ["/1.png", "/2.png", "/3.png", "/4.png"],
    description:
      "Testing Presentations, long paragraph to check text overflow and layout. This is a long description to ensure that the text wraps correctly and does not overflow the card. It should be long enough to test the layout effectively.",
    content: `
        Topics covered:
        - Testing layout and responsiveness
        - Ensuring text wraps correctly
        - Checking image loading and transitions
      `,
  },
];

export default function PresentationDetail() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const presentation = useMemo(
    () => presentations.find((p) => p.id === id),
    [id]
  );
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const total = presentation!.imageUrls.length;

  const next = () => setCurrentImageIndex((i) => (i + 1) % total);
  const prev = () => setCurrentImageIndex((i) => (i - 1 + total) % total);
  if (!presentation) {
    return (
      <div className="p-8 text-center text-red-600 font-semibold">
        Presentation not found.
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10 max-w-4xl">
      <h1 className="text-3xl sm:text-4xl font-bold text-blue-700 mb-6 text-center">
        {presentation.title}
      </h1>

      <div className="relative w-full aspect-video mb-8 rounded-xl overflow-hidden bg-gray-100">
        <Image
          src={presentation.imageUrls[currentImageIndex]}
          alt={`${presentation.title} - image ${currentImageIndex + 1}`}
          fill
          className="object-contain transition-opacity duration-300"
          sizes="(max-width: 768px) 100vw, 800px"
          priority
        />

        {total > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 rounded-full p-2 shadow-md z-10 cursor-pointer"
            >
              &#8592;
            </button>

            <button
              onClick={next}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 rounded-full p-2 shadow-md z-10 cursor-pointer"
            >
              &#8594;
            </button>
          </>
        )}
      </div>

      <p className="text-md sm:text-lg text-gray-700 mb-6 whitespace-pre-line">
        {presentation.description}
      </p>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 whitespace-pre-line text-sm sm:text-base text-gray-800">
        {presentation.content}
      </div>
    </div>
  );
}
