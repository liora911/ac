# Security & Dependency Report

Last updated: 2026-01-25

## Security Vulnerabilities (npm audit)

### Critical Issues

#### 1. jsPDF - Local File Inclusion/Path Traversal (CVE)
- **Package**: `jspdf`
- **Current Version**: 3.0.3
- **Fixed Version**: 4.0.0
- **Severity**: CRITICAL
- **Issue**: Local File Inclusion/Path Traversal vulnerability
- **Advisory**: https://github.com/advisories/GHSA-f8cm-6447-x5h2
- **Fix**: `npm install jspdf@4.0.0` (BREAKING CHANGE)
- **Impact**: Used for PDF generation in the editor
- **Action Required**: Review breaking changes before upgrading

### High Severity Issues

#### 2. Preact - JSON VNode Injection
- **Package**: `preact`
- **Current Version**: 10.27.0-10.27.2
- **Severity**: HIGH
- **Issue**: JSON VNode Injection vulnerability
- **Advisory**: https://github.com/advisories/GHSA-36hm-qxxp-pg3m
- **Fix**: `npm audit fix`
- **Impact**: Used as React alternative in some components
- **Action Required**: Run npm audit fix

#### 3. tar - Multiple Vulnerabilities
- **Package**: `tar`
- **Current Version**: <=7.5.3
- **Severity**: HIGH
- **Issues**:
  - Race condition leading to uninitialized memory exposure
  - Arbitrary File Overwrite and Symlink Poisoning
  - Unicode Ligature Collisions on macOS APFS
- **Advisories**:
  - https://github.com/advisories/GHSA-29xp-372q-xqph
  - https://github.com/advisories/GHSA-8qq5-rm4j-mr97
  - https://github.com/advisories/GHSA-r6q2-hw4h-h46w
- **Fix**: `npm audit fix`
- **Impact**: Build tooling dependency
- **Action Required**: Run npm audit fix

### Moderate Severity Issues

#### 4. js-yaml - Prototype Pollution
- **Package**: `js-yaml`
- **Current Version**: 4.0.0-4.1.0
- **Severity**: MODERATE
- **Issue**: Prototype pollution in merge (<<)
- **Advisory**: https://github.com/advisories/GHSA-mh29-5h37-fv8m
- **Fix**: `npm audit fix`
- **Impact**: YAML parsing (indirect dependency)
- **Action Required**: Run npm audit fix

#### 5. NextAuth - Email Misdelivery
- **Package**: `next-auth`
- **Current Version**: 4.24.11
- **Fixed Version**: 4.24.13
- **Severity**: MODERATE
- **Issue**: Email misdelivery vulnerability
- **Advisory**: https://github.com/advisories/GHSA-5jpx-9hw9-2fx4
- **Fix**: `npm audit fix`
- **Impact**: CRITICAL - Used for authentication
- **Action Required**: Upgrade immediately

#### 6. nodemailer - Multiple DoS Vulnerabilities
- **Package**: `nodemailer`
- **Current Version**: 6.10.1
- **Fixed Version**: 7.0.12
- **Severity**: MODERATE
- **Issues**:
  - Email to unintended domain (Interpretation Conflict)
  - DoS through recursive calls in addressparser
  - DoS through uncontrolled recursion
- **Advisories**:
  - https://github.com/advisories/GHSA-mm7p-fcc7-pg87
  - https://github.com/advisories/GHSA-rcmh-qjqh-p98v
  - https://github.com/advisories/GHSA-46j5-6fg5-4gv3
- **Fix**: `npm audit fix --force` (BREAKING CHANGE)
- **Impact**: Used for email sending (contact forms, notifications)
- **Action Required**: Review breaking changes before upgrading

#### 7. undici - Decompression DoS
- **Package**: `undici`
- **Current Version**: <6.23.0
- **Severity**: MODERATE
- **Issue**: Unbounded decompression chain in HTTP responses leads to resource exhaustion
- **Advisory**: https://github.com/advisories/GHSA-g9mf-h72j-4rw9
- **Fix**: `npm audit fix`
- **Impact**: Used by @vercel/blob for HTTP fetch operations
- **Action Required**: Run npm audit fix

---

## Recommended Action Plan

### ⚠️ DEPENDENCY CONFLICT DISCOVERED

Running `npm audit fix` will fail due to a dependency conflict:
- `next-auth@4.24.13` (fixed version) requires `nodemailer@^7.0.7`
- Project currently has `nodemailer@6.10.1`

**This means both packages must be upgraded together.**

### Immediate Actions (High Priority)

#### Option 1: Upgrade Both next-auth and nodemailer Together (Recommended)

```bash
# Upgrade both packages that have the dependency relationship
npm install next-auth@4.24.13 nodemailer@7.0.12

# Then fix remaining vulnerabilities
npm audit fix
```

This will fix: js-yaml, next-auth, nodemailer, preact, tar, undici (6/8 vulnerabilities)

**Testing Required After Upgrade:**
- Test magic link emails (authentication)
- Test contact form emails
- Test event ticket confirmation emails
- Review email template rendering

#### Option 2: Use Legacy Peer Deps (Quick Fix, Not Recommended)

```bash
npm audit fix --legacy-peer-deps
```

This bypasses the peer dependency check but may cause runtime issues.

#### Option 3: Force Update (Risky)

```bash
npm audit fix --force
```

This will force all updates including breaking changes. **Not recommended without testing.**

### After Fixing next-auth and nodemailer

2. **Review breaking changes for critical packages**:
   - **jspdf** (3.0.3 → 4.0.0): Review PDF generation code
   - **nodemailer** (6.10.1 → 7.0.12): ✅ Will be upgraded with next-auth

### Testing Before Upgrade

Before upgrading packages with breaking changes:

1. **nodemailer (6.10.1 → 7.0.12)** - MUST upgrade with next-auth:
   - **Locations to check**:
     - `src/lib/email/send.ts` - Core email sending function
     - `src/lib/email/templates/payment-confirmation.ts` - Event payment emails
     - `src/lib/email/templates/ticket-confirmation.ts` - Event ticket emails
     - `src/lib/auth/auth.ts` - NextAuth email provider config
   - **Breaking Changes** (v6 → v7):
     - DKIM signing API changes
     - Stream attachment handling changes
     - Some transport configuration changes
   - **Tests Required**:
     - ✅ Magic link authentication emails (NextAuth)
     - ✅ Contact form submissions
     - ✅ Event ticket confirmations (free events)
     - ✅ Event payment confirmations (paid events)
     - ✅ Email templates rendering (Hebrew & English)
   - **Migration guide**: https://github.com/nodemailer/nodemailer/releases/tag/v7.0.0

2. **jsPDF (3.0.3 → 4.0.0)**:
   - **Location**: `src/lib/editor/editor.tsx` (PDF export functionality)
   - **Test**: Verify PDF generation still works in Tiptap editor
   - **Migration guide**: https://github.com/parallax/jsPDF/releases

### Commands

```bash
# STEP 1: Fix the dependency conflict (next-auth + nodemailer together)
npm install next-auth@4.24.13 nodemailer@7.0.12

# STEP 2: Fix remaining vulnerabilities (js-yaml, preact, tar, undici)
npm audit fix

# STEP 3: (Optional) Fix jsPDF critical vulnerability
npm install jspdf@4.0.0

# STEP 4: Verify TypeScript compilation
npx tsc --noEmit

# STEP 5: Test the application
npm run dev
```

### Alternative: All-in-one (requires extensive testing)

```bash
# Upgrade all vulnerable packages at once
npm install next-auth@4.24.13 nodemailer@7.0.12 jspdf@4.0.0
npm audit fix

# Verify
npx tsc --noEmit
npm run dev
```

---

## Troubleshooting

### Issue: "ERESOLVE unable to resolve dependency tree"

**Problem**: `npm audit fix` fails because `next-auth@4.24.13` requires `nodemailer@^7.0.7` but project has `nodemailer@6.10.1`.

**Solution**: Upgrade both packages together:

```bash
npm install next-auth@4.24.13 nodemailer@7.0.12
```

### Issue: Email Functionality Breaks After Upgrade

If emails stop working after upgrading nodemailer:

1. **Check email configuration** in `src/lib/auth/auth.ts`:
   ```typescript
   // Ensure email provider config is correct for v7
   providers: [
     EmailProvider({
       server: {
         host: process.env.EMAIL_SERVER_HOST,
         port: Number(process.env.EMAIL_SERVER_PORT),
         auth: {
           user: process.env.EMAIL_SERVER_USER,
           pass: process.env.EMAIL_SERVER_PASSWORD,
         },
       },
       from: process.env.EMAIL_FROM,
     }),
   ]
   ```

2. **Check send.ts** for deprecated APIs:
   - DKIM signing syntax may have changed
   - Stream attachments API may have changed

3. **Test emails in development**:
   ```bash
   # Use a test email service like Ethereal
   # Or check server logs for SMTP errors
   ```

### Issue: TypeScript Errors After Upgrade

```bash
# Regenerate node_modules types
npm install
npx tsc --noEmit
```

---

## Outdated Packages

### Major Version Updates Available

#### Next.js
- **Current**: 15.5.9
- **Latest**: 16.1.4
- **Note**: Major version upgrade - review Next.js 16 migration guide
- **Decision**: Hold until stable

#### Node.js Types
- **Current**: 20.19.20
- **Latest (v20)**: 20.19.30
- **Latest (v25)**: 25.0.10
- **Note**: Latest is Node 25 types, but project uses Node 20
- **Action**: Upgrade to 20.19.30, not 25.0.10

### Recommended Updates (Safe)

These packages can be safely updated:

```bash
# AI SDK
npm install @ai-sdk/google@3.0.13 @ai-sdk/react@3.0.51 ai@6.0.49

# Prisma
npm install @prisma/client@6.19.2 prisma@6.19.2

# Tailwind CSS
npm install tailwindcss@4.1.18 @tailwindcss/postcss@4.1.18

# Tiptap Editor (all extensions)
npm install @tiptap/react@3.17.1 @tiptap/starter-kit@3.17.1 \
  @tiptap/extension-blockquote@3.17.1 \
  @tiptap/extension-bullet-list@3.17.1 \
  @tiptap/extension-code-block@3.17.1 \
  @tiptap/extension-color@3.17.1 \
  @tiptap/extension-highlight@3.17.1 \
  @tiptap/extension-horizontal-rule@3.17.1 \
  @tiptap/extension-image@3.17.1 \
  @tiptap/extension-link@3.17.1 \
  @tiptap/extension-list-item@3.17.1 \
  @tiptap/extension-ordered-list@3.17.1 \
  @tiptap/extension-placeholder@3.17.1 \
  @tiptap/extension-table@3.17.1 \
  @tiptap/extension-table-cell@3.17.1 \
  @tiptap/extension-table-header@3.17.1 \
  @tiptap/extension-table-row@3.17.1 \
  @tiptap/extension-task-item@3.17.1 \
  @tiptap/extension-task-list@3.17.1 \
  @tiptap/extension-text-align@3.17.1 \
  @tiptap/extension-text-style@3.17.1 \
  @tiptap/extension-underline@3.17.1 \
  @tiptap/extension-youtube@3.17.1 \
  @tiptap/pm@3.17.1

# React Query
npm install @tanstack/react-query@5.90.20

# TypeScript & Types
npm install @types/node@20.19.30 @types/react@19.2.9 @types/react-dom@19.2.3

# ESLint
npm install eslint@9.39.2 @eslint/eslintrc@3.3.3 \
  @typescript-eslint/eslint-plugin@8.53.1 \
  @typescript-eslint/parser@8.53.1

# Other utilities
npm install stripe@20.2.0 resend@6.8.0 framer-motion@12.29.0 \
  lucide-react@0.563.0 @vercel/blob@2.0.1
```

---

## External Dependencies to Monitor

### Critical Third-Party Services

1. **Vercel Blob Storage**
   - **Package**: `@vercel/blob`
   - **Purpose**: File uploads (images, PDFs, documents)
   - **Status**: Currently vulnerable via undici dependency
   - **Action**: Fixed with `npm audit fix`

2. **Stripe Payment Processing**
   - **Package**: `stripe`
   - **Purpose**: Event tickets and subscriptions
   - **Current**: 20.1.1
   - **Latest**: 20.2.0
   - **Action**: Minor update recommended

3. **NextAuth Authentication**
   - **Package**: `next-auth`
   - **Purpose**: User authentication (magic links)
   - **Current**: 4.24.11 (VULNERABLE)
   - **Fixed**: 4.24.13
   - **Action**: UPGRADE IMMEDIATELY

4. **Prisma ORM**
   - **Package**: `@prisma/client`, `prisma`
   - **Purpose**: Database access layer
   - **Current**: 6.17.0
   - **Latest**: 6.19.2
   - **Action**: Safe to upgrade

5. **Tiptap Editor**
   - **Multiple packages**: All @tiptap/* packages
   - **Purpose**: Rich text editor for articles/presentations
   - **Current**: 3.6.6 - 3.7.0
   - **Latest**: 3.17.1
   - **Action**: Major version jump, test thoroughly

6. **AI SDK (Vercel)**
   - **Packages**: `@ai-sdk/google`, `@ai-sdk/react`, `ai`
   - **Purpose**: AI features (if implemented)
   - **Current**: Various 3.x versions
   - **Latest**: Minor updates available
   - **Action**: Safe to update

---

## Deprecation Warnings

### None Currently

No packages are reporting deprecation warnings. However, monitor:

- **Next.js 15 → 16**: Major version available, review migration guide
- **Node.js**: Project uses Node 20.x (LTS until April 2026)

---

## Security Best Practices

### Ongoing Maintenance

1. **Weekly**: Run `npm audit` to check for new vulnerabilities
2. **Monthly**: Run `npm outdated` to check for updates
3. **Quarterly**: Review and update major dependencies
4. **Before Production**: Always run `npm audit` and fix critical/high issues

### Automated Tools

Consider setting up:

- **Dependabot**: GitHub automated dependency updates
- **Snyk**: Continuous security monitoring
- **npm audit** in CI/CD pipeline

---

## Summary

- **Total Vulnerabilities**: 8 (1 critical, 2 high, 5 moderate)
- **Packages Needing Immediate Attention**: 2 (next-auth, jspdf)
- **Safe Auto-fixes Available**: 5 packages
- **Breaking Changes Required**: 2 packages (jspdf, nodemailer)

**Recommended First Step**: Run `npm audit fix` to address 5/8 vulnerabilities, then manually review and update jspdf and nodemailer.
