# API Routes Reference

All API routes live under `/src/app/api/`.

## Articles
- `GET /api/articles` — List (params: page, limit, categoryId, search, status, sortBy, sortOrder)
- `POST /api/articles` — Create (auth + admin)
- `GET /api/articles/[id]` — Get by ID or slug
- `PUT /api/articles/[id]` — Update (auth + admin)
- `DELETE /api/articles/[id]` — Delete (auth + admin)
- `GET /api/articles/[id]/comments` — List article comments
- `POST /api/articles/[id]/comments` — Add comment
- `POST /api/articles/embeddings` — Generate AI embeddings
- `POST /api/articles/semantic-search` — AI semantic search

## Events, Lectures, Presentations
Same CRUD pattern as articles (GET list, POST create, GET/PUT/DELETE by ID).

## Categories
- `GET /api/categories` — List all categories
- `POST /api/categories` — Create (auth + admin)
- `GET /api/categories/[id]` — Get by ID
- `PUT /api/categories/[id]` — Update (auth + admin)
- `DELETE /api/categories/[id]` — Delete (auth + admin)

## Comments
- `GET /api/comments` — List comments
- `POST /api/comments` — Create comment (auth)
- `GET /api/comments/[id]` — Get by ID
- `PUT /api/comments/[id]` — Update (auth)
- `DELETE /api/comments/[id]` — Delete (auth + admin)

## Favorites
- `GET /api/favorites` — Get user's favorite IDs
- `GET /api/favorites/full` — Get full favorite items
- `POST /api/favorites` — Add (body: { itemId, itemType })
- `DELETE /api/favorites?itemId=X&itemType=Y` — Remove

## Tickets
- `GET /api/tickets` — List tickets
- `POST /api/tickets` — Create (returns Stripe checkout URL for paid events)
- `GET /api/tickets/[accessToken]` — Get by access token

## Notifications
- `GET /api/notifications` — List notifications (admin)
- `POST /api/notifications` — Create notification (admin)
- `GET /api/notifications/[id]` — Get by ID
- `DELETE /api/notifications/[id]` — Delete
- `PUT /api/notifications/[id]/read` — Mark as read
- `GET /api/notifications/unread-count` — Get unread count
- `GET /api/notifications/user` — Get user's notifications

## Admin
- `GET /api/admin/subscriptions` — List subscriptions
- `POST /api/admin/subscriptions/grant` — Grant subscription
- `POST /api/admin/subscriptions/revoke` — Revoke subscription

## Stripe Payments
- `POST /api/stripe/create-checkout-session` — Event ticket checkout
- `POST /api/stripe/create-subscription-session` — Subscription checkout
- `POST /api/stripe/customer-portal` — Stripe customer portal redirect
- `POST /api/stripe/webhook` — Stripe webhook handler

## Content & Pages
- `GET/PUT /api/about` — About page content (PUT = admin)
- `GET/PUT /api/account` — User account info
- `GET/POST /api/archive` — Archive items (POST = admin)
- `GET/PUT/DELETE /api/archive/[id]` — Archive item by ID
- `POST /api/assistant` — AI assistant chat
- `GET /api/browse` — Browse/discover content
- `GET/POST /api/contact` — Contact messages (POST = public form)
- `GET/DELETE /api/contact/[id]` — Contact message by ID (admin)
- `GET /api/footer-sitemap` — Footer sitemap data
- `GET /api/home-content` — Home page content
- `GET /api/home-preview` — Home preview content
- `GET /api/home-preview/categories` — Home preview categories
- `GET /api/search` — Global search
- `GET/PUT /api/site-settings` — Site settings (PUT = admin)
- `GET /api/stats` — Dashboard statistics (admin)

## Upload
- `POST /api/upload` — Vercel Blob upload handler

## Response Patterns

Each resource type has its own response structure:

- **Articles** — Paginated: `{ articles[], total, page, limit, totalPages }`
- **Events** — Simple array: `Event[]`
- **Lectures/Presentations** — Hierarchical tree: `TreeCategory[]` (id, name, items[], subcategories[])
- **Favorites** — Grouped IDs: `{ articles: string[], lectures: string[], presentations: string[] }`
- **Single item** — `Resource` object
- **Create** — `Resource` (created)
- **Update** — `Resource` (updated)
- **Delete** — `{ success: true }`
- **Error** — `{ error: "Message" }` with status 400|401|403|404|500

_Last updated: February 2026_
