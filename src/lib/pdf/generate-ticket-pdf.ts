"use client";

import React, { ReactElement } from "react";
import { pdf, DocumentProps } from "@react-pdf/renderer";
import {
  TicketPDFDocument,
  TicketPDFData,
  TicketPDFLabels,
} from "./ticket-pdf-document";

export async function generateTicketPDF(
  ticket: TicketPDFData,
  labels: TicketPDFLabels,
  locale: string,
  filename: string
): Promise<void> {
  const pdfDocument = React.createElement(TicketPDFDocument, {
    ticket,
    labels,
    locale,
  }) as unknown as ReactElement<DocumentProps>;

  const blob = await pdf(pdfDocument).toBlob();

  // Create download link
  const url = URL.createObjectURL(blob);
  const link = window.document.createElement("a");
  link.href = url;
  link.download = filename;
  window.document.body.appendChild(link);
  link.click();
  window.document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
