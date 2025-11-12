# Avshalom Elitzur Personal Website

A comprehensive web application showcasing the work of Avshalom Elitzur, a renowned physicist and philosopher specializing in quantum mechanics, foundations of physics, and consciousness studies.

## 🌟 Overview

This Next.js application serves as a professional platform for Avshalom Elitzur to share his research, publications, lectures, presentations, and events. The platform includes both public-facing content and an administrative dashboard for content management.

### Key Features

- **📝 Articles**: Publish and manage scientific articles and publications
- **🎤 Lectures**: Showcase recorded lectures and presentations
- **📊 Presentations**: Display slide decks and research presentations
- **📅 Events**: Manage upcoming and past events
- **📧 Contact**: Handle inquiries and messages
- **🔍 Search**: Full-text search across all content
- **🌐 Internationalization**: Support for English and Hebrew
- **🎨 Themes**: Light/dark mode support
- **📱 Responsive**: Mobile-first design
- **🔐 Authentication**: Secure admin access via NextAuth
- **📊 Admin Dashboard**: Comprehensive content management interface

## 🛠 Tech Stack

### Frontend

- **Next.js 15** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Animation library
- **Lucide React** - Icon library
- **React Icons** - Additional icon sets

### Backend & Database

- **Prisma** - ORM for database management
- **PostgreSQL** - Primary database (hosted on Neon)
- **NextAuth.js** - Authentication framework

### Content & Media

- **TipTap Editor** - Rich text editor for content creation
- **HTML2Canvas & jsPDF** - PDF generation capabilities
- **Next.js Image** - Optimized image handling

### Development Tools

- **ESLint** - Code linting
- **TypeScript** - Type checking
- **Bundle Analyzer** - Build optimization

## 📁 Project Structure

```
├── prisma/                 # Database schema and migrations
│   ├── schema.prisma      # Prisma schema definition
│   └── migrations/        # Database migrations
├── public/                # Static assets
│   ├── flags/            # Country flag icons
│   └── [images]          # Images and media files
├── scripts/               # Utility scripts
├── src/
│   ├── app/              # Next.js App Router pages
│   │   ├── api/          # API routes
│   │   ├── articles/     # Articles pages
│   │   ├── contact/      # Contact page
│   │   ├── elitzur/      # Admin dashboard
│   │   ├── events/       # Events pages
│   │   ├── lectures/     # Lectures pages
│   │   ├── presentations/# Presentations pages
│   │   └── search/       # Search page
│   ├── components/       # React components
│   │   ├── Articles/     # Article-related components
│   │   ├── Auth/         # Authentication components
│   │   ├── Category/     # Category management
│   │   ├── Contact/      # Contact form
│   │   ├── Create*/      # Content creation components
│   │   ├── Edit*/        # Content editing components
│   │   ├── Events/       # Event components
│   │   ├── Footer/       # Site footer
│   │   ├── Header/       # Site header
│   │   ├── Home/         # Homepage components
│   │   ├── Lectures/     # Lecture components
│   │   ├── Login/        # Login form
│   │   ├── Modal/        # Modal dialogs
│   │   ├── Presentations/# Presentation components
│   │   └── [other]/      # Utility components
│   ├── constants/        # Application constants
│   ├── contexts/         # React contexts
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utility libraries
│   ├── locales/          # Translation files
│   └── types/            # TypeScript type definitions
```

## 🚀 Installation & Setup

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

## 📊 Database Schema

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

- `GET /api/articles` - List articles with filtering and pagination
  - Query parameters: `page`, `limit`, `categoryId`, `status`, `search`, `sortBy`, `sortOrder`
- `POST /api/articles` - Create new article (authenticated)
- `GET /api/articles/[id]` - Get specific article
- `PUT /api/articles/[id]` - Update article (authenticated)
- `DELETE /api/articles/[id]` - Delete article (authenticated)

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

## 🎯 Usage

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

## 🌍 Internationalization

The application supports multiple languages:

- **English (en)**: Default language
- **Hebrew (he)**: Right-to-left support with RTL text direction

Language files are located in `src/locales/` and can be extended for additional languages.

## 🎨 Theming

- **Light Mode**: Default theme
- **Dark Mode**: Automatic system preference detection
- **Customizable**: Theme context for future extensions

## 🔧 Development Scripts

```bash
# Development
npm run dev              # Start development server
npm run build           # Build for production
npm start               # Start production server

# Database
npm run db:generate     # Generate Prisma client
npm run db:push         # Push schema changes
npm run db:migrate      # Run migrations
npm run db:studio       # Open Prisma Studio
npm run db:seed         # Seed database
npm run db:reset        # Reset database
npm run db:debug        # Debug database issues

# Code Quality
npm run lint            # Run ESLint
npm run analyze         # Bundle analyzer
```

## 🚀 Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push

### Other Platforms

The application can be deployed to any platform supporting Node.js:

- Netlify
- Railway
- DigitalOcean App Platform
- Self-hosted with Docker

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes and test thoroughly
4. Commit your changes: `git commit -am 'Add new feature'`
5. Push to the branch: `git push origin feature/your-feature`
6. Submit a pull request

### Development Guidelines

- Follow TypeScript best practices
- Use ESLint configuration
- Write meaningful commit messages
- Test API endpoints thoroughly
- Maintain responsive design principles
- Ensure accessibility compliance

## 📄 License

This project is private and proprietary. All rights reserved.

## 📞 Contact

For technical inquiries or collaboration opportunities, please use the contact form on the website or reach out directly to the development team.

## 🙏 Acknowledgments

- **Avshalom Elitzur** - For his groundbreaking work in quantum physics and philosophy
- **Next.js Team** - For the excellent React framework
- **Prisma Team** - For the powerful ORM
- **Vercel** - For hosting and deployment platform
- **Open Source Community** - For the amazing tools and libraries

---

_Built with ❤️ for advancing scientific knowledge and understanding._
