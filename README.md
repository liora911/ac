# Avshalom Elitzur Personal Website

A comprehensive web application showcasing the work of Avshalom Elitzur, a renowned physicist and philosopher specializing in quantum mechanics, foundations of physics, and consciousness studies.

## Overview

A Next.js CMS for academics to manage articles, lectures, presentations, and events with full administrative control.

### Key Features

- ** Articles**: Publish and manage scientific articles and publications
- ** Lectures**: Showcase recorded lectures and presentations
- ** Presentations**: Display slide decks and research presentations
- ** Events**: Manage upcoming and past events
- ** Contact**: Handle inquiries and messages
- ** Search**: Full-text search across all content
- ** Internationalization**: Support for English and Hebrew
- ** Themes**: Light/dark mode support
- ** Responsive**: Mobile-first design
- ** Authentication**: Secure admin access via NextAuth
- ** Admin Dashboard**: Comprehensive content management interface

## 🛠 Tech Stack

### Frontend

**Core:** Next.js 15 • React 19 • TypeScript • Tailwind CSS  
**Database:** PostgreSQL • Prisma ORM  
**Auth:** NextAuth.js (email magic links)  
**Editor:** TipTap (rich text)

### Content & Media

- **TipTap Editor** - Rich text editor for content creation
- **HTML2Canvas & jsPDF** - PDF generation capabilities
- **Next.js Image** - Optimized image handling

## Project Structure

```
├── prisma/           # Database schema & migrations
├── src/
│   ├── app/          # Next.js routes (public & admin)
│   │   ├── api/      # REST API endpoints
│   │   └── elitzur/  # Admin dashboard
│   ├── components/   # React components
│   ├── lib/          # Utilities (auth, db, editor)
│   └── types/        # TypeScript definitions
└── public/           # Static assets
```

For detailed structure, see the codebase.

## Installation & Setup

### Prerequisites

- **Node.js 20.x** - Runtime environment
- **npm** or **yarn** - Package manager
- **PostgreSQL** - Database (or Neon account for cloud hosting)

### 1. Clone the Repository

```bash
git clone <repository-url>
cd ace
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Create a `.env` file in the root directory with the following variables:

```env
# Database URLs (PostgreSQL)
DATABASE_URL=your_postgresql_connection_string
POSTGRES_PRISMA_URL=your_postgresql_connection_string
POSTGRES_URL_NON_POOLING=your_direct_postgresql_connection_string

# Email Configuration (for contact forms)
EMAIL_SERVER_USER=your_email@gmail.com
EMAIL_SERVER_PASSWORD=your_app_password
EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_PORT=587
EMAIL_FROM=your_email@gmail.com

# NextAuth Configuration
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your_random_secret_key
```

### 4. Database Setup

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# (Optional) Seed the database with sample data
npm run db:seed
```

### 5. Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

## Database Schema

The application uses Prisma ORM with PostgreSQL. Key models include:

### Core Models

- **User**: Authentication and user management
- **Article**: Scientific publications and blog posts
- **Lecture**: Recorded lectures and talks
- **Presentation**: Slide presentations and research decks
- **Event**: Scheduled events and conferences
- **Category**: Hierarchical content categorization
- **Message**: Contact form submissions

### Relationships

- Users can create Articles, Lectures, Presentations, and Events
- Content is organized by Categories (hierarchical)
- Authentication via NextAuth with multiple providers

## 🔗 API Endpoints

### Articles API (`/api/articles`)

```
GET    /api/{type}        # List (with ?page, ?search, ?categoryId)
POST   /api/{type}        # Create (auth required)
GET    /api/{type}/[id]   # Read single
PUT    /api/{type}/[id]   # Update (auth required)
DELETE /api/{type}/[id]   # Delete (auth required)
```

Types: `articles`, `lectures`, `presentations`, `events`, `categories`

Special: `/api/search` (global search), `/api/contact` (messages)

### Other Content APIs

Similar RESTful endpoints exist for:

- `/api/lectures` - Lecture management
- `/api/presentations` - Presentation management
- `/api/events` - Event management
- `/api/categories` - Category management
- `/api/contact` - Contact form handling
- `/api/search` - Global search functionality

### Authentication

- `GET/POST /api/auth/[...nextauth]` - NextAuth.js authentication routes

## Usage

### Public Features

1. **Homepage**: Introduction and biography of Avshalom Elitzur
2. **Articles**: Browse published scientific articles and publications
3. **Lectures**: Access recorded lectures and talks
4. **Presentations**: View research presentations and slide decks
5. **Events**: Check upcoming and past events
6. **Contact**: Send messages and inquiries
7. **Search**: Find content across all sections

### Admin Features (Dashboard at `/elitzur`)

1. **Content Management**: Create, edit, and delete all content types
2. **Category Management**: Organize content with hierarchical categories
3. **User Management**: Handle authentication and permissions
4. **Message Management**: View and respond to contact form submissions
5. **Settings**: Configure site-wide settings
6. **Analytics**: View content statistics and activity feeds

## Internationalization

The application supports multiple languages:

- **English (en)**: Default language
- **Hebrew (he)**: Right-to-left support with RTL text direction

Language files are located in `src/locales/` and can be extended for additional languages.

## Theming

- **Light Mode**: Default theme
- **Dark Mode**: Automatic system preference detection
- **Customizable**: Theme context for future extensions

## 🔧 Development Scripts

```bash
npm run dev          # Start development
npm run build        # Build for production

# Database
npm run db:push      # Sync schema (dev)
npm run db:migrate   # Run migrations (prod)
npm run db:studio    # Open Prisma Studio
```

See `package.json` for all scripts.

## Deployment

**Vercel (recommended):** Connect repo, set env vars, deploy.  
**Self-hosted:** Requires Node.js 20+, PostgreSQL, and environment variables.

See `.env.example` for required configuration.

### Development Guidelines

- Follow TypeScript best practices
- Use ESLint configuration
- Write meaningful commit messages
- Test API endpoints thoroughly
- Maintain responsive design principles
- Ensure accessibility compliance

## Security & Dependencies

For detailed information about security vulnerabilities, outdated packages, and recommended updates, see [SECURITY.md](./SECURITY.md).

**Quick Check:**
```bash
npm audit              # Check for vulnerabilities
npm outdated           # Check for updates
```

**Current Status** (as of 2026-01-25):
- 8 vulnerabilities detected (1 critical, 2 high, 5 moderate)
- Immediate action required for: `next-auth`, `jspdf`
- See [SECURITY.md](./SECURITY.md) for full details and action plan

## License

This project is private and proprietary. All rights reserved.
