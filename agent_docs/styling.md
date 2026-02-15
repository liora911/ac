# Styling Guide

Uses Tailwind CSS 4. Follow existing patterns in the codebase.

## Dark Mode — Required

Always include `dark:` variants for every visual property:

```
bg-white dark:bg-gray-900
text-gray-900 dark:text-white
border-gray-200 dark:border-gray-700
```

## Common Class Patterns

Reference existing components for the authoritative patterns. General approach:

- **Buttons:** `px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50`
- **Cards:** `bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm`
- **Inputs:** `w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500`
- **Links:** `text-blue-600 dark:text-blue-400 hover:underline`

## RTL Support

Hebrew locale uses RTL layout. See `src/contexts/Translation/translation.context.tsx` for the translation context.

```typescript
const { locale } = useTranslation();
const isRTL = locale === "he";
// Apply: dir={isRTL ? "rtl" : "ltr"}
```

## Responsive Design

Mobile-first with Tailwind breakpoints:

```
grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4
text-sm md:text-base
px-4 md:px-6 lg:px-8
```

_Last updated: February 2026_
