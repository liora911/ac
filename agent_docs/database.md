# Database Guide

Schema file: `prisma/schema.prisma`

## Core Content Models

**Article** — id, title, slug (unique), content (HTML), direction ("ltr"|"rtl"), published, isPremium, isFeatured. Relations: author, category, categories[], authors[], tags[]

**Lecture** — id, title, description, videoUrl, duration, date, isPremium, published. Relations: author, category

**Presentation** — id, title, description, content, googleSlidesUrl, imageUrls[], pdfUrl, isPremium, published. Relations: author, category

**Event** — id, title, description, eventType ("in-person"|"online"), eventDate, location/onlineUrl, maxSeats, price (agorot), currency. Relations: author, category, tickets[]

## User & Auth Models

**User** — id, email (unique), name, image, role (ADMIN|USER), stripeCustomerId. Relations: subscription, favorites[]

**Subscription** — userId, stripeSubscriptionId, status (ACTIVE|CANCELED|PAST_DUE|EXPIRED), currentPeriodStart, currentPeriodEnd

## Junction Tables (Many-to-Many)

- `ArticleCategory` — articleId, categoryId
- `ArticleTag` — articleId, tagId
- `ArticleAuthor` — articleId, name, imageUrl, order

## Schema Management

### CRITICAL: Always sync after schema changes

After modifying `prisma/schema.prisma`, you MUST run:

```bash
npx prisma db push
```

If you skip this, the database won't have the new columns, Prisma queries will fail with "column does not exist" errors, and authentication will break.

### Development Workflow

1. Edit `prisma/schema.prisma`
2. Run `npx prisma db push` (syncs database)
3. Run `npx prisma generate` (updates Prisma Client — usually runs automatically)
4. Restart dev server if needed

### Useful Commands

```bash
npx prisma db pull --print    # View current database schema
npx prisma studio             # Open database GUI
```

## Troubleshooting: Auth is Broken

**Symptom:** "Column does not exist" errors, users can't log in, Prisma Studio won't open

**Cause:** Database schema is out of sync with Prisma schema

**Fix:** Run `npx prisma db push` then restart the dev server. This is the #1 most common issue.

_Last updated: February 2026_
