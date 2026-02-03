# CLAUDE.md - Project Guidelines for Avshalom Elitzur Website

> This file is read by Claude at the start of every session. It contains project-specific guidelines, patterns, and conventions to ensure consistent development.

---

## 1. PROJECT OVERVIEW

**What is this?** A personal academic website for Professor Avshalom C. Elitzur, featuring articles, lectures, presentations, and events with premium content, subscriptions, and multilingual support (Hebrew/English).

**Tech Stack:**
- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript 5
- **Database:** PostgreSQL + Prisma ORM
- **Auth:** NextAuth v4 (Email magic links)
- **Storage:** Vercel Blob (direct client uploads)
- **Payments:** Stripe (subscriptions + event tickets)
- **Styling:** Tailwind CSS 4
- **State:** React Query (server) + Context (client)
- **Editor:** Tiptap (rich text)
- **i18n:** Custom context with en.json/he.json

---

## 2. CRITICAL PATTERNS - MUST FOLLOW

### 2.1 Upload Components - ALWAYS REUSE
**NEVER create custom upload UI.** Always use the existing `DragDropImageUpload` component:

```typescript
import DragDropImageUpload from "@/components/Upload/upload";

<DragDropImageUpload
  onImageSelect={(url) => setImageUrl(url || "")}
  currentImage={currentImage}
  placeholder="PNG, JPG, GIF, WebP (max 5MB)"
  onError={(msg) => alert(msg)}
/>
```

This component provides:
- Drag-and-drop support
- Click to upload
- Progress indicator
- Preview with remove button
- Consistent styling across the app

### 2.2 Sorting - Use createdAt, NOT updatedAt
**Always sort content by `createdAt` descending** (newest first) unless specifically requested otherwise.

```typescript
// CORRECT
orderBy: { createdAt: "desc" }

// WRONG - Don't use updatedAt for display sorting
orderBy: { updatedAt: "desc" }
```

### 2.3 React Query Hook Pattern
Use the key factory pattern for all queries:

```typescript
export const resourceKeys = {
  all: ["resource"] as const,
  lists: () => [...resourceKeys.all, "list"] as const,
  list: (params) => [...resourceKeys.lists(), params] as const,
  details: () => [...resourceKeys.all, "detail"] as const,
  detail: (id) => [...resourceKeys.details(), id] as const,
};

export function useResource(params = {}) {
  return useQuery({
    queryKey: resourceKeys.list(params),
    queryFn: async () => { /* fetch */ },
    staleTime: 1000 * 60 * 5,  // 5 minutes
    gcTime: 1000 * 60 * 30,     // 30 minutes
  });
}
```

### 2.4 API Response Patterns
Each resource type has its own response structure based on its needs:

```typescript
// ARTICLES - Paginated list (large dataset)
GET /api/articles → {
  articles: Article[],
  total: number,
  page: number,
  limit: number,
  totalPages: number
}

// EVENTS - Simple array (smaller dataset)
GET /api/events → Event[]

// LECTURES - Hierarchical tree (grouped by category)
GET /api/lectures → TreeCategory[] // { id, name, lectures[], subcategories[] }

// PRESENTATIONS - Hierarchical tree (grouped by category)
GET /api/presentations → TreeCategory[] // { id, name, presentations[], subcategories[] }

// FAVORITES - Grouped IDs by type
GET /api/favorites → {
  articles: string[],
  lectures: string[],
  presentations: string[]
}

// SINGLE ITEM (all resources)
GET /api/[resource]/[id] → Resource
POST /api/[resource] → Resource (created)
PUT /api/[resource]/[id] → Resource (updated)
DELETE /api/[resource]/[id] → { success: true }

// ERROR (all endpoints)
{ error: "Message" } with status 400|401|403|404|500
```

**Why different patterns?** Each structure fits its use case - articles need pagination, lectures/presentations need category grouping, events are simple lists.

### 2.5 Authentication & Authorization
```typescript
// Get session
const session = await getServerSession(authOptions);

// Check authenticated
if (!session?.user) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

// Check admin (use ALLOWED_EMAILS constant)
import { ALLOWED_EMAILS } from "@/constants/auth";
if (!ALLOWED_EMAILS.includes(session.user.email.toLowerCase())) {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

// Check premium access
const hasAccess = !item.isPremium || session?.user?.hasActiveSubscription || session?.user?.role === "ADMIN";
```

---

## 3. PROJECT STRUCTURE

```
/src
  /app                    # Next.js App Router
    /api                  # API routes (REST)
      /articles           # CRUD for articles
      /events             # CRUD for events
      /lectures           # CRUD for lectures
      /presentations      # CRUD for presentations
      /categories         # Category management
      /favorites          # User favorites
      /tickets            # Event tickets
      /stripe             # Payment webhooks
      /upload             # File upload handler
      /auth               # Auth endpoints
    /articles/[id]        # Article detail page
    /events/[id]          # Event detail page
    /lectures/[id]        # Lecture detail page
    /presentations/[id]   # Presentation detail page
    /elitzur              # Admin dashboard (protected)
    /account              # User account (protected)
    /auth                 # Auth pages (login, verify)

  /components             # Reusable components
    /Articles             # Article-related components
    /Events               # Event-related components
    /Lectures             # Lecture-related components
    /Presentations        # Presentation-related components
    /Upload               # Upload components (REUSE THESE!)
    /Modal                # Modal dialog
    /Header               # Navigation header
    /Footer               # Site footer
    /Breadcrumbs          # Navigation breadcrumbs
    /RichContent          # Rich text renderer
    /PremiumGate          # Premium content blocker
    /PremiumBadge         # Premium indicator
    /FavoriteButton       # Toggle favorite

  /hooks                  # React Query hooks
    useArticles.ts
    useEvents.ts
    useLectures.ts
    usePresentations.ts
    useCategories.ts
    useFavorites.ts

  /contexts               # React Context providers
    ThemeContext.tsx      # Dark/light mode
    NotificationContext.tsx # Toast notifications
    Translation           # i18n context

  /lib                    # Utilities & configurations
    /auth                 # NextAuth config
    /prisma               # Prisma client
    /stripe               # Stripe helpers
    /upload               # Upload utilities
    /editor               # Tiptap editor
    /utils                # General utilities (slug, etc.)

  /locales                # Translations
    en.json               # English
    he.json               # Hebrew

  /types                  # TypeScript definitions
  /constants              # App constants (ALLOWED_EMAILS, etc.)

/prisma
  schema.prisma           # Database schema
```

---

## 4. DATABASE MODELS

### Core Content Models
```
Article
  - id, title, slug (unique), content (HTML)
  - direction: "ltr" | "rtl"
  - published, isPremium, isFeatured
  - Relations: author, category, categories[], authors[], tags[]

Lecture
  - id, title, description, videoUrl, duration, date
  - isPremium, published
  - Relations: author, category

Presentation
  - id, title, description, content
  - googleSlidesUrl, imageUrls[], pdfUrl
  - isPremium, published
  - Relations: author, category

Event
  - id, title, description, eventType ("in-person" | "online")
  - eventDate, location/onlineUrl
  - maxSeats, price (agorot), currency
  - Relations: author, category, tickets[]
```

### User & Auth Models
```
User
  - id, email (unique), name, image
  - role: ADMIN | USER
  - stripeCustomerId
  - Relations: subscription, favorites[]

Subscription
  - userId, stripeSubscriptionId
  - status: ACTIVE | CANCELED | PAST_DUE | EXPIRED
  - currentPeriodStart, currentPeriodEnd
```

### Junction Tables (Many-to-Many)
```
ArticleCategory  - articleId, categoryId
ArticleTag       - articleId, tagId
ArticleAuthor    - articleId, name, imageUrl, order
```

---

## 5. COMPONENT GUIDELINES

### 5.1 Existing Components to Reuse

| Component | Location | Use For |
|-----------|----------|---------|
| `DragDropImageUpload` | `/components/Upload/upload.tsx` | ALL image uploads |
| `Modal` | `/components/Modal/Modal.tsx` | Dialogs, confirmations |
| `RichContent` | `/components/RichContent/RichContent.tsx` | Rendering HTML content |
| `PremiumGate` | `/components/PremiumGate/PremiumGate.tsx` | Blocking premium content |
| `PremiumBadge` | `/components/PremiumBadge.tsx` | Premium indicators |
| `FavoriteButton` | `/components/FavoriteButton.tsx` | Favorite toggles |
| `AuthorAvatars` | `/components/Articles/AuthorAvatars.tsx` | Displaying authors |
| `Breadcrumbs` | `/components/Breadcrumbs/Breadcrumbs.tsx` | Navigation breadcrumbs |

### 5.2 Form Patterns
- **Multi-tab forms:** See `ArticleForm.tsx` for 3-tab pattern
- **Validation:** Validate per-tab before allowing next
- **Multiple items:** Use array state with add/remove buttons
- **Authors:** Support multiple authors with order and avatars

### 5.3 Notification Usage
```typescript
import { useNotification } from "@/contexts/NotificationContext";
import { useTranslation } from "@/contexts/Translation/TranslationContext";

const { showSuccess, showError } = useNotification();
const { t } = useTranslation();

// CORRECT - Use translation keys
showSuccess(t("articleDetail.linkCopied"));
showError(t("common.saveError"));

// WRONG - Never hardcode strings
// showSuccess("הקישור הועתק!");  ❌
// showError("שגיאה בשמירה");     ❌
```

> **Note:** The codebase currently has ~30 files with hardcoded Hebrew strings in notifications. These should be migrated to use translation keys.

---

## 6. STYLING CONVENTIONS

### 6.1 Dark Mode Support
Always include dark mode variants:
```typescript
className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
className="border-gray-200 dark:border-gray-700"
```

### 6.2 Common Patterns
```typescript
// Buttons
"px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"

// Cards
"bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm"

// Inputs
"w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"

// Links
"text-blue-600 dark:text-blue-400 hover:underline"
```

### 6.3 RTL Support
Hebrew locale uses RTL. Handle with:
```typescript
const { locale } = useTranslation();
const isRTL = locale === "he";
dir={isRTL ? "rtl" : "ltr"}
```

### 6.4 Responsive Design
Mobile-first with Tailwind breakpoints:
```typescript
"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
"text-sm md:text-base"
"px-4 md:px-6 lg:px-8"
```

---

## 7. API ROUTES REFERENCE

### Articles
- `GET /api/articles` - List (params: page, limit, categoryId, search, status, sortBy, sortOrder)
- `POST /api/articles` - Create (auth + admin)
- `GET /api/articles/[id]` - Get by ID or slug
- `PUT /api/articles/[id]` - Update (auth + admin)
- `DELETE /api/articles/[id]` - Delete (auth + admin)

### Events, Lectures, Presentations
Same CRUD pattern as articles.

### Favorites
- `GET /api/favorites` - Get user's favorite IDs
- `GET /api/favorites/full` - Get full favorite items
- `POST /api/favorites` - Add (body: { itemId, itemType })
- `DELETE /api/favorites?itemId=X&itemType=Y` - Remove

### Tickets
- `GET /api/tickets` - List tickets
- `POST /api/tickets` - Create (returns Stripe checkout URL for paid events)
- `GET /api/tickets/[accessToken]` - Get by access token

### Upload
- `POST /api/upload` - Vercel Blob upload handler

---

## 8. TRANSLATIONS (i18n)

### Adding New Translations
Add to both `/src/locales/en.json` and `/src/locales/he.json`:

```json
// en.json
{
  "articleDetail": {
    "share": "Share",
    "linkCopied": "Link copied to clipboard!"
  }
}

// he.json
{
  "articleDetail": {
    "share": "שתף",
    "linkCopied": "הקישור הועתק!"
  }
}
```

### Usage
```typescript
const { t } = useTranslation();
<button>{t("articleDetail.share")}</button>
```

---

## 9. TIPTAP EDITOR

### Location
`/src/lib/editor/editor.tsx`

### Features Included
- Text formatting (bold, italic, underline, strike, code)
- Headings (H1, H2, H3)
- Lists (bullet, numbered, task)
- Alignment (left, center, right, justify)
- Tables
- Images (with drag-drop upload)
- YouTube embeds
- Links
- Blockquotes
- Code blocks
- Font size & line height
- Text direction (RTL/LTR)
- Colors & highlights

### Image Upload in Editor
The editor uses `DragDropImageUpload` component for consistency.

---

## 10. COMMON UTILITIES

### Slug Generation
```typescript
import { generateSlug, generateUniqueSlug } from "@/lib/utils/slug";

const baseSlug = generateSlug("מאמר בעברית"); // Returns URL-safe slug
const uniqueSlug = await generateUniqueSlug(baseSlug, async (slug) => {
  const existing = await prisma.article.findUnique({ where: { slug } });
  return existing !== null;
});
```

### Client Upload
```typescript
import { clientUpload, isImageFile } from "@/lib/upload/client-upload";

if (isImageFile(file)) {
  const result = await clientUpload(file, (progress) => setProgress(progress));
  if (result.success) {
    // result.url contains the uploaded file URL
  }
}
```

---

## 11. ENVIRONMENT VARIABLES

Required variables (see `.env.example`):
```
# Database
POSTGRES_PRISMA_URL
POSTGRES_URL_NON_POOLING

# Auth
NEXTAUTH_SECRET
NEXTAUTH_URL

# Email (SMTP)
EMAIL_SERVER_HOST
EMAIL_SERVER_PORT
EMAIL_SERVER_USER
EMAIL_SERVER_PASSWORD
EMAIL_FROM

# Stripe
STRIPE_SECRET_KEY
STRIPE_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET

# Vercel Blob
BLOB_READ_WRITE_TOKEN

# AI (optional)
OPENAI_API_KEY
GOOGLE_GENERATIVE_AI_API_KEY

# Site
NEXT_PUBLIC_SITE_URL
```

---

## 12. ADMIN ACCESS

Admin users are defined in `/src/constants/auth.ts`:
```typescript
export const ALLOWED_EMAILS = [
  "avshalom@iyar.org.il",
  "yarinmster@gmail.com",
  "yakir@iyar.org.il"
];
```

Admin routes are under `/elitzur/*` and protected by middleware.

---

## 13. PREMIUM CONTENT FLOW

1. Content marked with `isPremium: true`
2. Check access: `!isPremium || hasActiveSubscription || isAdmin`
3. Block with `<PremiumGate>` component if no access
4. Subscriptions managed via Stripe

---

## 14. DATABASE SCHEMA MANAGEMENT

### CRITICAL: Always Sync Schema Changes

**After modifying `prisma/schema.prisma`, you MUST sync the database:**

```bash
npx prisma db push
```

**Why this matters:**
- If you add/modify fields in the schema but don't push, the database won't have those columns
- All Prisma queries will fail with "column does not exist" errors
- **This breaks authentication and the entire app**

### Development Workflow
1. Edit `prisma/schema.prisma`
2. Run `npx prisma db push` (syncs database)
3. Run `npx prisma generate` (updates Prisma Client - usually runs automatically)
4. Restart dev server if needed

### Production Deployment
- Vercel automatically runs migrations during deployment
- For manual deployments, ensure migrations run before starting the app

### Checking Schema Status
```bash
# View current database schema
npx prisma db pull --print

# Open database GUI
npx prisma studio
```

---

## 15. COMMON MISTAKES TO AVOID

1. **Creating new upload UI** - Always use `DragDropImageUpload`
2. **Sorting by updatedAt** - Use `createdAt` for display
3. **Missing dark mode** - Always add `dark:` variants
4. **Hardcoded strings** - Use translation keys
5. **Missing auth checks** - Verify session in API routes
6. **Direct DB queries in components** - Use React Query hooks
7. **Inline styles** - Use Tailwind classes
8. **Missing error handling** - Always try-catch API operations
9. **Forgetting `prisma db push`** - ALWAYS sync schema changes to database

---

## 16. TESTING CHECKLIST

Before marking a feature complete:
- [ ] Works in light mode
- [ ] Works in dark mode
- [ ] Works in Hebrew (RTL)
- [ ] Works in English (LTR)
- [ ] Works on mobile
- [ ] Works for anonymous users
- [ ] Works for logged-in users
- [ ] Works for admin users
- [ ] Error states handled
- [ ] Loading states shown

---

## 17. GIT CONVENTIONS

Commit messages should be clear and concise:
```
feat: add share button to article cards
fix: breadcrumb sticky scroll issue
refactor: use DragDropImageUpload in editor
```

---

## 18. TROUBLESHOOTING

### Auth is Broken / Users Can't Login

**Symptom:** "Column does not exist" errors, users can't log in, Prisma Studio won't open

**Cause:** Database schema is out of sync with Prisma schema

**Fix:**
```bash
npx prisma db push
```

Then restart your dev server. This is the #1 most common issue.

### Admin Access Lost

**Check in Prisma Studio:**
1. Open `User` table
2. Find your user by email
3. Verify `role` is set to `ADMIN` (not `USER`)
4. If not, manually change it to `ADMIN` and save

**Check email whitelist:**
Your email must be in `/src/constants/auth.ts` `ALLOWED_EMAILS` array (case insensitive).

### Deployment Issues

If production is broken but local works:
1. Ensure environment variables are set in Vercel
2. Check that database migrations ran during deployment
3. Redeploy: `git push` or `npx vercel --prod`

### Rate Limiting

If getting rate limit errors:
- Auth: 10 requests per 15 minutes
- Contact: 5 requests per 15 minutes
- AI Assistant: 10 requests per minute

Wait for the window to expire or clear the in-memory rate limit map (restart server).

---

## 19. QUICK REFERENCE

### Run Development
```bash
npm run dev
```

### Generate Prisma Client
```bash
npx prisma generate
```

### Push Schema Changes (CRITICAL!)
```bash
npx prisma db push
```

### View Database
```bash
npx prisma studio
```

### Check Schema Status
```bash
npx prisma db pull --print
```

---

*Last updated: February 2026*
