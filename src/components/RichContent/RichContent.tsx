"use client";

import React from "react";

interface RichContentProps {
  content: string;
  className?: string;
}

/**
 * RichContent component renders HTML content from TipTap editor
 * with proper styling for all supported elements:
 * - Headings (h1, h2, h3)
 * - Paragraphs
 * - Bold, Italic, Underline, Strikethrough
 * - Links
 * - Lists (bullet, numbered, task)
 * - Blockquotes
 * - Code (inline and blocks)
 * - Tables
 * - Images
 * - YouTube embeds
 * - Horizontal rules
 * - Text alignment
 * - Text colors and highlights
 */
export default function RichContent({ content, className = "" }: RichContentProps) {
  if (!content) return null;

  return (
    <div className={`rich-content ${className}`}>
      <div dangerouslySetInnerHTML={{ __html: content }} />
      <style jsx global>{`
        .rich-content {
          line-height: 1.7;
          color: inherit;
        }

        /* Paragraphs */
        .rich-content p {
          margin: 0.75em 0;
        }

        /* Headings */
        .rich-content h1 {
          font-size: 2em;
          font-weight: 700;
          margin: 1em 0 0.5em;
          line-height: 1.3;
        }

        .rich-content h2 {
          font-size: 1.5em;
          font-weight: 600;
          margin: 0.9em 0 0.5em;
          line-height: 1.35;
        }

        .rich-content h3 {
          font-size: 1.25em;
          font-weight: 600;
          margin: 0.8em 0 0.4em;
          line-height: 1.4;
        }

        /* Bold, Italic, Underline, Strike */
        .rich-content strong {
          font-weight: 700;
        }

        .rich-content em {
          font-style: italic;
        }

        .rich-content u {
          text-decoration: underline;
        }

        .rich-content s,
        .rich-content del {
          text-decoration: line-through;
        }

        /* Links */
        .rich-content a {
          color: #2563eb;
          text-decoration: underline;
          transition: color 0.15s;
        }

        .rich-content a:hover {
          color: #1d4ed8;
        }

        /* Bullet Lists */
        .rich-content ul {
          list-style-type: disc;
          padding-left: 1.5em;
          margin: 0.75em 0;
        }

        .rich-content ul ul {
          list-style-type: circle;
        }

        .rich-content ul ul ul {
          list-style-type: square;
        }

        /* Ordered Lists */
        .rich-content ol {
          list-style-type: decimal;
          padding-left: 1.5em;
          margin: 0.75em 0;
        }

        .rich-content ol ol {
          list-style-type: lower-alpha;
        }

        .rich-content ol ol ol {
          list-style-type: lower-roman;
        }

        .rich-content li {
          margin: 0.25em 0;
        }

        /* Task Lists */
        .rich-content ul[data-type="taskList"] {
          list-style: none;
          padding-left: 0;
        }

        .rich-content ul[data-type="taskList"] li {
          display: flex;
          align-items: flex-start;
          gap: 0.5em;
        }

        .rich-content ul[data-type="taskList"] li > label {
          user-select: none;
          flex-shrink: 0;
        }

        .rich-content ul[data-type="taskList"] li > label input[type="checkbox"] {
          margin-top: 0.25em;
          width: 1em;
          height: 1em;
          cursor: pointer;
        }

        .rich-content ul[data-type="taskList"] li > div {
          flex: 1;
        }

        /* Blockquotes */
        .rich-content blockquote {
          border-left: 4px solid #3b82f6;
          background: linear-gradient(to right, #eff6ff, transparent);
          padding: 1em 1.25em;
          margin: 1em 0;
          font-style: italic;
          color: #4b5563;
          border-radius: 0 8px 8px 0;
        }

        .rich-content blockquote p {
          margin: 0.25em 0;
        }

        .rich-content blockquote p:first-child {
          margin-top: 0;
        }

        .rich-content blockquote p:last-child {
          margin-bottom: 0;
        }

        /* RTL Blockquotes */
        .rich-content[dir="rtl"] blockquote,
        [dir="rtl"] .rich-content blockquote {
          border-left: none;
          border-right: 4px solid #3b82f6;
          border-radius: 8px 0 0 8px;
          background: linear-gradient(to left, #eff6ff, transparent);
        }

        /* Inline Code */
        .rich-content code {
          background: #f3f4f6;
          padding: 0.15em 0.4em;
          border-radius: 4px;
          font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
          font-size: 0.875em;
          color: #e11d48;
        }

        /* Code Blocks */
        .rich-content pre {
          background: #1f2937;
          color: #e5e7eb;
          padding: 1em 1.25em;
          border-radius: 8px;
          overflow-x: auto;
          margin: 1em 0;
          font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
          font-size: 0.875em;
          line-height: 1.6;
        }

        .rich-content pre code {
          background: transparent;
          padding: 0;
          color: inherit;
          font-size: inherit;
        }

        /* Tables */
        .rich-content table {
          border-collapse: collapse;
          width: 100%;
          margin: 1em 0;
          overflow-x: auto;
          display: block;
        }

        .rich-content table th,
        .rich-content table td {
          border: 1px solid #d1d5db;
          padding: 0.625em 0.875em;
          text-align: left;
        }

        .rich-content table th {
          background: #f9fafb;
          font-weight: 600;
        }

        .rich-content table tr:hover {
          background: #f9fafb;
        }

        /* Images */
        .rich-content img {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          margin: 1em 0;
        }

        /* YouTube Embeds */
        .rich-content iframe[src*="youtube"],
        .rich-content div[data-youtube-video] iframe {
          width: 100%;
          aspect-ratio: 16 / 9;
          border-radius: 8px;
          margin: 1em 0;
        }

        /* Horizontal Rule */
        .rich-content hr {
          border: none;
          border-top: 2px solid #e5e7eb;
          margin: 2em 0;
        }

        /* Text Alignment */
        .rich-content [style*="text-align: center"],
        .rich-content .text-center {
          text-align: center;
        }

        .rich-content [style*="text-align: right"],
        .rich-content .text-right {
          text-align: right;
        }

        .rich-content [style*="text-align: justify"],
        .rich-content .text-justify {
          text-align: justify;
        }

        /* Highlight/Mark */
        .rich-content mark {
          padding: 0.1em 0.2em;
          border-radius: 2px;
        }

        /* Text Direction Support */
        .rich-content[dir="rtl"],
        [dir="rtl"] .rich-content {
          direction: rtl;
        }

        .rich-content[dir="rtl"] ul,
        .rich-content[dir="rtl"] ol,
        [dir="rtl"] .rich-content ul,
        [dir="rtl"] .rich-content ol {
          padding-left: 0;
          padding-right: 1.5em;
        }

        .rich-content[dir="rtl"] table th,
        .rich-content[dir="rtl"] table td,
        [dir="rtl"] .rich-content table th,
        [dir="rtl"] .rich-content table td {
          text-align: right;
        }

        /* First and last element margins */
        .rich-content > div > *:first-child {
          margin-top: 0;
        }

        .rich-content > div > *:last-child {
          margin-bottom: 0;
        }
      `}</style>
    </div>
  );
}
