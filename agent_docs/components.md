# Components Guide

## Reusable Components — Always Check Before Building

| Component | Location | Use For |
|-----------|----------|---------|
| `DragDropImageUpload` | `/components/Upload/upload.tsx` | ALL image uploads |
| `MultiImageUpload` | `/components/Upload/MultiImageUpload.tsx` | Multiple image uploads |
| `PdfUpload` | `/components/Upload/PdfUpload.tsx` | PDF file uploads |
| `Modal` | `/components/Modal/Modal.tsx` | Dialogs, confirmations |
| `RichContent` | `/components/RichContent/RichContent.tsx` | Rendering HTML content |
| `PremiumGate` | `/components/PremiumGate/PremiumGate.tsx` | Blocking premium content |
| `PremiumBadge` | `/components/PremiumBadge/PremiumBadge.tsx` | Premium indicators |
| `FavoriteButton` | `/components/FavoriteButton/FavoriteButton.tsx` | Favorite toggles |
| `AuthorAvatars` | `/components/Articles/AuthorAvatars.tsx` | Displaying authors |
| `Breadcrumbs` | `/components/Breadcrumbs/Breadcrumbs.tsx` | Navigation breadcrumbs |
| `LoadingSpinner` | `/components/LoadingSpinner/LoadingSpinner.tsx` | Loading indicators |
| `Tooltip` | `/components/Tooltip/Tooltip.tsx` | Hover tooltips |
| `BottomSheet` | `/components/BottomSheet/BottomSheet.tsx` | Mobile bottom sheets |
| `CommentSection` | `/components/Comments/CommentSection.tsx` | Article comments |
| `PdfViewer` | `/components/PdfViewer/PdfViewer.tsx` | PDF document viewing |
| `AuthPrompt` | `/components/AuthPrompt/AuthPrompt.tsx` | Login prompt overlay |
| `SettingsPanel` | `/components/Settings/SettingsPanel.tsx` | User settings panel |
| `GlobalSearch` | `/components/GlobalSearch.tsx` | Global search bar |

## Form Components

| Component | Location | Use For |
|-----------|----------|---------|
| `ArticleForm` | `/components/Articles/ArticleForm.tsx` | Article create/edit (3-tab pattern) |
| `EventForm` | `/components/EventForm/EventForm.tsx` | Event create/edit |
| `LectureForm` | `/components/LectureForm/LectureForm.tsx` | Lecture create/edit |
| `PresentationForm` | `/components/PresentationForm/PresentationForm.tsx` | Presentation create/edit |

## Form Patterns
- **Multi-tab forms:** See `ArticleForm.tsx` for the 3-tab pattern
- **Validation:** Validate per-tab before allowing next
- **Multiple items:** Use array state with add/remove buttons
- **Authors:** Support multiple authors with order and avatars

## Notification Usage

Always use translation keys with notifications:

```typescript
import { useNotification } from "@/contexts/NotificationContext";
import { useTranslation } from "@/contexts/Translation/TranslationContext";

const { showSuccess, showError } = useNotification();
const { t } = useTranslation();

showSuccess(t("articleDetail.linkCopied"));  // correct
showError(t("common.saveError"));            // correct
// showSuccess("הקישור הועתק!");             // WRONG - never hardcode
```

_Last updated: February 2026_
