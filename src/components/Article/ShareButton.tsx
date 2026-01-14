"use client";

import { Share2 } from "lucide-react";
import { useNotification } from "@/contexts/NotificationContext";

interface ShareButtonProps {
  shareText: string;
  copiedText: string;
}

export default function ShareButton({ shareText, copiedText }: ShareButtonProps) {
  const { showSuccess } = useNotification();

  const handleShare = async () => {
    const url = window.location.href;

    try {
      await navigator.clipboard.writeText(url);
      showSuccess(copiedText);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = url;
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      showSuccess(copiedText);
    }
  };

  return (
    <button
      onClick={handleShare}
      className="inline-flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors cursor-pointer shadow-sm"
    >
      <Share2 className="w-4 h-4" />
      <span>{shareText}</span>
    </button>
  );
}
