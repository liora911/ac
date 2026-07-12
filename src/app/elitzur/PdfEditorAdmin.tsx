"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

// react-pdf touches browser-only APIs, so the editor is loaded client-side only
const PdfEditor = dynamic(() => import("@/components/PdfTools/PdfEditor"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center py-24">
      <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
    </div>
  ),
});

export default function PdfEditorAdmin() {
  return <PdfEditor />;
}
