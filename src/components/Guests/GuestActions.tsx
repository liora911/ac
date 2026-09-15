"use client";

import { Share2, Download } from "lucide-react";
import { useNotification } from "@/contexts/NotificationContext";
import { useTranslation } from "@/hooks/useTranslation";
import type { Guest } from "@/types/Guests/guests";

const btnCls =
  "inline-flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors cursor-pointer shadow-sm";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Share + Download PDF for a guest's public page — mirrors the article buttons.
 * Share always copies the canonical slug URL (/guests/<slug>), never the id the
 * visitor may have arrived with, and uses the native share sheet on phones.
 */
export default function GuestActions({
  guest,
  displayName,
}: {
  guest: Guest;
  displayName: string;
}) {
  const { t, locale } = useTranslation();
  const { showSuccess, showError } = useNotification();

  // Canonical, human-readable link — decoded so Hebrew slugs stay legible
  const canonicalUrl = () =>
    decodeURI(`${window.location.origin}/guests/${guest.slug || guest.id}`);

  const copyLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = url;
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
    }
    showSuccess(t("guests.linkCopied"));
  };

  const handleShare = async () => {
    const url = canonicalUrl();
    // Native share sheet where available (mostly mobile); copy otherwise
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({
          title: displayName,
          text: guest.headline || displayName,
          url,
        });
        return;
      } catch (err) {
        // User dismissed the sheet — nothing to do
        if ((err as Error)?.name === "AbortError") return;
      }
    }
    await copyLink(url);
  };

  const handleDownload = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      showError(t("guests.popupBlocked"));
      return;
    }

    const dir = guest.titleDirection === "ltr" ? "ltr" : "rtl";
    const title = escapeHtml(displayName);
    const headline = guest.headline ? escapeHtml(guest.headline) : "";
    const url = escapeHtml(canonicalUrl());
    const photo = guest.photoUrl
      ? `<img class="photo" src="${escapeHtml(guest.photoUrl)}" alt="" />`
      : "";
    const gallery = (guest.galleryUrls ?? [])
      .map((u) => `<img class="gallery-img" src="${escapeHtml(u)}" alt="" />`)
      .join("");

    // The bio is the same trusted rich HTML already rendered on the page
    printWindow.document.write(`<!DOCTYPE html>
<html dir="${dir}" lang="${locale}">
<head>
<meta charset="UTF-8">
<title>${title}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Hebrew:wght@400;700&display=swap');
  * { box-sizing: border-box; }
  body { font-family: 'Noto Sans Hebrew', Arial, sans-serif; line-height: 1.8; color: #1a1a1a;
         max-width: 800px; margin: 0 auto; padding: 40px; direction: ${dir}; }
  .header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #e5e5e5; }
  .photo { width: 120px; height: 120px; border-radius: 50%; object-fit: cover; margin-bottom: 16px; }
  h1 { font-size: 28px; margin: 0 0 8px; }
  .headline { color: #555; font-size: 16px; margin: 0; }
  .content { font-size: 16px; }
  .content img { max-width: 100%; height: auto; }
  .content h1, .content h2, .content h3 { margin-top: 1.4em; }
  .gallery { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 30px; }
  .gallery-img { width: 100%; aspect-ratio: 1; object-fit: cover; border-radius: 8px; }
  .footer { margin-top: 40px; padding-top: 12px; border-top: 1px solid #e5e5e5; font-size: 12px; color: #777; text-align: center; direction: ltr; }
  @media print { body { padding: 20px; } @page { margin: 2cm; } .gallery-img { break-inside: avoid; } }
</style>
</head>
<body>
  <div class="header">
    ${photo}
    <h1>${title}</h1>
    ${headline ? `<p class="headline">${headline}</p>` : ""}
  </div>
  <div class="content">${guest.bio ?? ""}</div>
  ${gallery ? `<div class="gallery">${gallery}</div>` : ""}
  <div class="footer">${url}</div>
  <script>
    // Wait for images before printing so they land in the PDF
    window.onload = function () {
      var imgs = Array.prototype.slice.call(document.images);
      Promise.all(imgs.map(function (img) {
        return img.complete ? Promise.resolve() : new Promise(function (r) { img.onload = img.onerror = r; });
      })).then(function () {
        window.print();
        window.onafterprint = function () { window.close(); };
      });
    };
  </script>
</body>
</html>`);
    printWindow.document.close();
  };

  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <button type="button" onClick={handleShare} className={btnCls}>
        <Share2 className="w-4 h-4" />
        <span>{t("guests.share")}</span>
      </button>
      <button type="button" onClick={handleDownload} className={btnCls}>
        <Download className="w-4 h-4" />
        <span>{t("guests.downloadPdf")}</span>
      </button>
    </div>
  );
}
