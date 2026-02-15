# Code Patterns

## React Query Hook Pattern

All hooks live in `/src/hooks/`. Use the key factory pattern — see any existing hook for reference (e.g., `useArticles.ts`).

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
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });
}
```

## Authentication & Authorization

Auth config: `src/lib/auth/auth.ts`
API auth helpers: `src/lib/auth/apiAuth.ts`
Admin emails constant: `src/constants/auth.ts`

```typescript
// Get session
const session = await getServerSession(authOptions);

// Check authenticated
if (!session?.user) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

// Check admin
import { ALLOWED_EMAILS } from "@/constants/auth";
if (!ALLOWED_EMAILS.includes(session.user.email.toLowerCase())) {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

// Check premium access
const hasAccess = !item.isPremium || session?.user?.hasActiveSubscription || session?.user?.role === "ADMIN";
```

## Premium Content Flow

1. Content marked with `isPremium: true`
2. Check access: `!isPremium || hasActiveSubscription || isAdmin`
3. Block with `<PremiumGate>` component if no access
4. Subscriptions managed via Stripe (see `src/lib/stripe/stripe.ts`)

## Environment Variables

Required variables are documented in `.env.example`. Key groups:
- Database: `POSTGRES_PRISMA_URL`, `POSTGRES_URL_NON_POOLING`
- Auth: `NEXTAUTH_SECRET`, `NEXTAUTH_URL`
- Email: `EMAIL_SERVER_*`, `EMAIL_FROM`
- Stripe: `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`
- Storage: `BLOB_READ_WRITE_TOKEN`
- AI (optional): `OPENAI_API_KEY`, `GOOGLE_GENERATIVE_AI_API_KEY`
- Site: `NEXT_PUBLIC_SITE_URL`

_Last updated: February 2026_
