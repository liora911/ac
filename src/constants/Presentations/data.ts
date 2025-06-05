import { PresentationDetailProps } from "@/types/Presentations/presentations";

export const presentations: PresentationDetailProps[] = [
  {
    id: "qm-001",
    title: "Quantum Mechanics Insights",
    imageUrls: ["/consc.png", "/moon.png", "/qft.png"],
    description: "An overview of foundational concepts in quantum mechanics.",
    content: "",
  },
  {
    id: "rel-002",
    title: "Exploring Relativity",
    imageUrls: ["/spacetime.png", "/schrodingercat.jpg"],
    description: "Delving into the theories of special and general relativity.",
    content:
      "Covered Topics - Special Relativity, General Relativity, Time Dilation, Gravitational Waves",
  },
  {
    id: "bio-003",
    title: "Evolutionary Biology Today",
    imageUrls: ["/electroncloud.png", "/qftt.png"],
    description: "Current research and discussions in evolutionary biology.",
    content: "1",
  },
  {
    id: "mind-004",
    title: "Philosophy of Mind",
    imageUrls: ["/moon.png"],
    description: "Exploring consciousness and the nature of mind.",
    content: "2",
  },
  {
    id: "test-001",
    title: "Yarin Test Presentation",
    imageUrls: ["/1.png", "/2.png", "/3.png", "/4.png"],
    description:
      "Testing Presentations, long paragraph to check text overflow and layout. This is a long description to ensure that the text wraps correctly and does not overflow the card. It should be long enough to test the layout effectively.",
    content: "3",
  },
];
