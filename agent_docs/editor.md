# Tiptap Editor & Utilities

## Editor Location

Main editor: `src/lib/editor/editor.tsx`

Custom extensions in `src/lib/editor/extensions/`:
- `FontSize.ts` — Custom font size control
- `Indent.ts` — Indentation support
- `LineHeight.ts` — Line height control

RTL/LTR support: `src/lib/editor/text-direction.ts`

## Editor Features

Text formatting (bold, italic, underline, strike, code), Headings (H1-H3), Lists (bullet, numbered, task), Alignment (left, center, right, justify), Tables, Images (with drag-drop upload via `DragDropImageUpload`), YouTube embeds, Links, Blockquotes, Code blocks, Font size & line height, Text direction (RTL/LTR), Colors & highlights.

## Common Utilities

### Slug Generation — `src/lib/utils/slug.ts`
```typescript
import { generateSlug, generateUniqueSlug } from "@/lib/utils/slug";
```

### Client Upload — `src/lib/upload/client-upload.ts`
```typescript
import { clientUpload, isImageFile } from "@/lib/upload/client-upload";
```

### Other Utilities in `src/lib/utils/`
- `categoryTree.ts` — Build hierarchical category trees
- `clipboard.ts` — Clipboard operations
- `currency.ts` — Currency formatting
- `date.ts` — Date formatting
- `share.ts` — Share functionality
- `status.ts` — Status helpers
- `stripHtml.ts` — Strip HTML tags
- `youtube.ts` — Parse YouTube URLs

### PDF Utilities in `src/lib/pdf/`
- `download-element-as-pdf.ts` — Export DOM elements as PDF
- `generate-ticket-pdf.ts` — Generate ticket PDFs
- `ticket-pdf-document.tsx` — Ticket PDF React template

### Other Libs
- `src/lib/email/resend.ts` — Email sending via Resend
- `src/lib/email/templates/` — Email templates (payment, ticket confirmation)
- `src/lib/embeddings/embeddings.ts` — AI text embeddings
- `src/lib/rate-limit/rate-limit.ts` — API rate limiting
- `src/lib/react-query/QueryProvider.tsx` — React Query provider wrapper

_Last updated: February 2026_
