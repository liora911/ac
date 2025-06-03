"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";

interface PresentationCardProps {
  id: string;
  title: string;
  imageUrls: string[];
  description: string;
}

const presentations: PresentationCardProps[] = [
  // Placeholder data - we'll need actual data for these
  {
    id: "qm-001",
    title: "Quantum Mechanics Insights",
    imageUrls: ["/consc.png", "/moon.png", "/qft.png"],
    description: "An overview of foundational concepts in quantum mechanics.",
  },
  {
    id: "rel-002",
    title: "Exploring Relativity",
    imageUrls: ["/spacetime.png", "/schrodingercat.jpg"],
    description: "Delving into the theories of special and general relativity.",
  },
  {
    id: "bio-003",
    title: "Evolutionary Biology Today",
    imageUrls: ["/electroncloud.png", "/qftt.png"],
    description: "Current research and discussions in evolutionary biology.",
  },
  {
    id: "mind-004",
    title: "Philosophy of Mind",
    imageUrls: ["/moon.png"],
    description: "Exploring consciousness and the nature of mind.",
  },
  {
    id: "test-001",
    title: "Yarin Test Presentation",
    imageUrls: ["/1.png", "/2.png", "/3.png", "/4.png"],
    description:
      "Testing Presentations, long paragraph to check text overflow and layout. This is a long description to ensure that the text wraps correctly and does not overflow the card. It should be long enough to test the layout effectively.",
  },
];

export default function Presentations() {
  const router = useRouter();

  const handleCardClick = (presentationId: string) => {
    router.push(`/presentation?id=${presentationId}`);
  };

  return (
    <div className="container mx-auto px-4 py-8 sm:py-12">
      <p className="text-lg sm:text-xl md:text-2xl text-gray-700 mb-8 sm:mb-12 leading-relaxed text-center max-w-3xl mx-auto">
        My research topics are diverse, spanning over quantum mechanics,
        relativity, thermodynamics, evolutionary biology, psychoanalysis and
        philosophy of mind.
      </p>

      <h2 className="text-2xl sm:text-3xl font-semibold text-blue-700 mb-6 sm:mb-8 text-center">
        Presentations
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
        {presentations.map((presentation) => (
          <div
            key={presentation.id}
            className="bg-white rounded-lg shadow-lg overflow-hidden cursor-pointer transform transition-transform hover:scale-105 duration-300 ease-in-out"
            onClick={() => handleCardClick(presentation.id)}
          >
            <div className="relative h-48 sm:h-56 w-full">
              <Image
                src={presentation.imageUrls[0]}
                alt={presentation.title}
                layout="fill"
                objectFit="cover"
                className="transition-opacity duration-300 ease-in-out hover:opacity-90"
              />
            </div>
            <div className="p-4 sm:p-6">
              <h3 className="text-md sm:text-lg font-semibold text-blue-600 mb-2">
                {presentation.title}
              </h3>
              <p className="text-xs sm:text-sm text-gray-600">
                {presentation.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
