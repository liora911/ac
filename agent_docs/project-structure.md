# Project Structure

Complete file tree for the Avshalom Elitzur website.

```
/prisma
  schema.prisma                       # Database schema

/src
  /actions
    upload.ts                         # Server action for uploads

  /app                                # Next.js App Router
    globals.css                       # Global styles
    layout.tsx                        # Root layout
    page.tsx                          # Home page
    robots.ts                         # SEO robots.txt
    sitemap.ts                        # SEO sitemap

    # --- Pages ---
    /about/page.tsx                   # About page
    /account/                         # User account (protected)
      AccountClient.tsx
      page.tsx
    /archive/page.tsx                 # Archive page
    /article/page.tsx                 # Single article redirect
    /articles/                        # Articles section
      page.tsx                        # Articles list
      create/page.tsx                 # Create article
      [id]/page.tsx                   # Article detail
      [id]/edit/page.tsx              # Edit article
    /articles-demo/page.tsx           # Articles demo page
    /auth/                            # Auth pages
      admin-login/page.tsx
      error/page.tsx
      login/page.tsx
      unauthorized/page.tsx
      verify-request/page.tsx
    /browse/page.tsx                  # Browse/discover content
    /contact/page.tsx                 # Contact page
    /create-event/page.tsx            # Create event
    /create-lecture/page.tsx          # Create lecture
    /create-presentation/page.tsx     # Create presentation
    /edit-article/[id]/page.tsx       # Edit article (alt route)
    /edit-event/[id]/page.tsx         # Edit event
    /edit-lecture/[id]/page.tsx       # Edit lecture
    /edit-presentation/[id]/page.tsx  # Edit presentation
    /elitzur/                         # Admin dashboard (protected)
      page.tsx
      AboutAdmin.tsx
      ArticlesAdmin.tsx
      CommentsAdmin.tsx
      ElitzurDashboard.tsx
      EventsAdmin.tsx
      HomeAdmin.tsx
      LecturesAdmin.tsx
      MessagesAdmin.tsx
      NotificationsAdmin.tsx
      PresentationsAdmin.tsx
      SettingsAdmin.tsx
      SubscriptionsAdmin.tsx
      events/[eventId]/tickets/page.tsx  # Event ticket management
    /events/                          # Events section
      page.tsx
      [id]/page.tsx
    /favorites/page.tsx               # User favorites
    /lectures/                        # Lectures section
      page.tsx
      [id]/page.tsx
    /my-tickets/page.tsx              # User's tickets
    /presentations/                   # Presentations section
      page.tsx
      [id]/page.tsx
    /pricing/page.tsx                 # Subscription pricing
    /search/page.tsx                  # Search page
    /ticket-acquire/page.tsx          # Ticket purchase flow
    /ticket-summary/[id]/page.tsx     # Ticket summary

    # --- API Routes ---
    /api
      /about/route.ts                 # About page content
      /account/route.ts               # User account management
      /admin/subscriptions/           # Admin subscription management
        route.ts
        grant/route.ts
        revoke/route.ts
      /archive/                       # Archive CRUD
        route.ts
        [id]/route.ts
      /articles/                      # Articles CRUD
        route.ts
        [id]/route.ts
        [id]/comments/route.ts        # Article comments
        embeddings/route.ts           # AI embeddings
        semantic-search/route.ts      # AI semantic search
      /assistant/route.ts             # AI assistant
      /auth/[...nextauth]/route.ts    # NextAuth handler
      /browse/route.ts                # Browse/discover API
      /categories/                    # Category CRUD
        route.ts
        [id]/route.ts
      /comments/                      # Comments CRUD
        route.ts
        [id]/route.ts
      /contact/                       # Contact messages
        route.ts
        [id]/route.ts
      /events/                        # Events CRUD
        route.ts
        [id]/route.ts
      /favorites/                     # User favorites
        route.ts
        full/route.ts
      /footer-sitemap/route.ts        # Footer sitemap data
      /home-content/route.ts          # Home page content
      /home-preview/                  # Home preview
        route.ts
        categories/route.ts
      /lectures/                      # Lectures CRUD
        route.ts
        [id]/route.ts
      /notifications/                 # Notifications system
        route.ts
        [id]/route.ts
        [id]/read/route.ts
        unread-count/route.ts
        user/route.ts
      /presentations/                 # Presentations CRUD
        route.ts
        [id]/route.ts
      /search/route.ts                # Global search
      /site-settings/route.ts         # Site settings
      /stats/route.ts                 # Dashboard stats
      /stripe/                        # Stripe payments
        create-checkout-session/route.ts
        create-subscription-session/route.ts
        customer-portal/route.ts
        webhook/route.ts
      /tickets/                       # Event tickets
        route.ts
        [accessToken]/route.ts
      /upload/route.ts                # Vercel Blob upload

  /components                         # Reusable components
    /ActivityFeed/ActivityFeed.tsx     # Admin activity feed
    /AIAssistant/                     # AI chat assistant
      AIAssistantButton.tsx
      index.ts
    /Analytics/StatCounter.tsx        # Analytics counter
    /Article/                         # Single article view
      article.tsx
      ArticleClient.tsx
      DownloadPDFButton.tsx
      ShareButton.tsx
    /Articles/                        # Article list & forms
      ArticleForm.tsx
      ArticleModal.tsx
      ArticlesList.tsx
      AuthorAvatars.tsx
      AuthorInput.tsx
      MobileArticleCard.tsx
      SemanticSearch.tsx
    /Auth/                            # Auth UI
      authSessionProvider.tsx
      SignOutButton.tsx
      UnauthorizedScreen.tsx
    /AuthPrompt/AuthPrompt.tsx        # Login prompt overlay
    /BottomSheet/BottomSheet.tsx      # Mobile bottom sheet
    /Breadcrumbs/Breadcrumbs.tsx      # Navigation breadcrumbs
    /Category/CategoryManager.tsx     # Category CRUD manager
    /CategoryPreferences/WelcomeModal.tsx  # Onboarding preferences
    /Clock/Clock.tsx                  # Clock widget
    /Comments/CommentSection.tsx      # Comment system
    /Contact/contact.tsx              # Contact form
    /Container/container.tsx          # Layout container
    /CreateEvent/create_event.tsx     # Event creation page
    /CreateLecture/create_lecture.tsx  # Lecture creation page
    /CreatePresentation/create_presentation.tsx  # Presentation creation page
    /DevMetrics/DevMetrics.tsx        # Developer metrics
    /DocumentViewer/DocumentViewer.tsx  # Document viewer
    /EditArticle/edit_article.tsx     # Article edit page
    /EditEvent/edit_event.tsx         # Event edit page
    /EditLecture/edit_lecture.tsx     # Lecture edit page
    /EditPresentation/edit_presentation.tsx  # Presentation edit page
    /EventForm/                       # Event form component
      EventForm.tsx
      index.ts
    /Events/                          # Event components
      EventModal.tsx
      Events.tsx
      EventsCalendar.tsx
      FeaturedEvent.tsx
    /FavoriteButton/                  # Favorite toggle
      FavoriteButton.tsx
      index.ts
    /Footer/footer.tsx                # Site footer
    GlobalSearch.tsx                   # Global search bar
    /Header/                          # Navigation header
      AIAssistantPanel.tsx
      header.tsx
    /Home/                            # Home page components
      CarouselSection.tsx
      ContentCard.tsx
      FeaturedCarouselSection.tsx
      home.tsx
      MixedCarouselSection.tsx
    /LectureForm/                     # Lecture form component
      LectureForm.tsx
      index.ts
    /Lectures/                        # Lecture components
      LectureModal.tsx
      LecturesCarouselView.tsx
    /LoadingSpinner/LoadingSpinner.tsx  # Loading indicator
    /Login/login.tsx                  # Login page
    /MainContent/MainContent.tsx      # Main content wrapper
    /Modal/Modal.tsx                  # Modal dialog
    /Motion/MotionProvider.tsx        # Framer Motion provider
    /MotivationalQuote/MotivationalQuote.tsx  # Quote widget
    /Notifications/NotificationsSection.tsx   # Notification list
    /PdfViewer/                       # PDF viewer
      PdfViewer.tsx
      index.ts
    /Placeholders/                    # Empty state placeholders
      LecturePlaceholder.tsx
      PresentationPlaceholder.tsx
      index.ts
    /PremiumBadge/                    # Premium indicator
      PremiumBadge.tsx
      index.ts
    /PremiumGate/PremiumGate.tsx      # Premium content blocker
    /PresentationForm/                # Presentation form
      PresentationForm.tsx
      index.ts
    /Presentations/                   # Presentation components
      PresentationsCarouselView.tsx
      SlidesPlayer.tsx
    /QuickActions/QuickActions.tsx     # Admin quick actions
    /QuickStats/QuickStats.tsx        # Admin quick stats
    /QuoteOfTheDay/QuoteOfTheDay.tsx  # Daily quote widget
    /RichContent/                     # Rich text renderer
      RichContent.tsx
      index.ts
    /Settings/                        # Settings panel
      AIAssistant.tsx
      DefaultViewToggle.tsx
      FontSizeToggle.tsx
      LanguageToggle.tsx
      ReduceMotionToggle.tsx
      SettingsButton.tsx
      SettingsPanel.tsx
      ThemeToggleSection.tsx
      index.ts
    /SystemHealth/SystemHealth.tsx     # System health monitor
    ThemeToggle.tsx                    # Theme toggle button
    /Tooltip/                         # Tooltip component
      Tooltip.tsx
      index.ts
    /Upload/                          # Upload components (REUSE THESE!)
      MultiImageUpload.tsx
      PdfUpload.tsx
      upload.tsx                      # DragDropImageUpload
    /Weather/Weather.tsx              # Weather widget

  /constants                          # App constants
    /Events/data.ts                   # Event constants
    /Lectures/data.ts                 # Lecture constants
    /Nav/data.ts                      # Navigation data
    api.ts                            # API constants
    app.ts                            # App-wide constants
    AppNavigationMap.ts               # Navigation mapping
    auth.ts                           # ALLOWED_EMAILS
    breadcrumbs.ts                    # Breadcrumb config
    cache.ts                          # Cache settings
    contact.ts                        # Contact constants
    ElitzurTabs.ts                    # Admin tab definitions
    images.ts                         # Image constants
    pagination.ts                     # Pagination defaults
    query-cache.ts                    # React Query cache config
    timing.ts                         # Timing constants

  /contexts                           # React Context providers
    CategoryPreferencesContext.tsx     # User category preferences
    NotificationContext.tsx            # Toast notifications
    SettingsContext.tsx                # App settings (font, motion, etc.)
    ThemeContext.tsx                   # Dark/light mode
    /Translation
      translation.context.tsx         # i18n context

  /data
    quotes.ts                         # Motivational quotes

  /hooks                              # React Query & custom hooks
    useAIChat.ts                      # AI assistant chat
    useArchive.ts                     # Archive items
    useArticles.ts                    # Articles CRUD
    useCarouselExpand.ts              # Carousel expand state
    useComments.ts                    # Comments
    useDebouncedValue.ts              # Debounce utility
    useEvents.ts                      # Events CRUD
    useFavorites.ts                   # User favorites
    useHomeContent.ts                 # Home page content
    useHomePreview.ts                 # Home preview
    useLectures.ts                    # Lectures CRUD
    useNotifications.ts               # Notifications
    usePresentations.ts               # Presentations CRUD
    useSiteSettings.ts                # Site settings
    useSpeechToText.ts                # Speech-to-text input
    useTabNavigation.ts               # Tab navigation state
    useTranslation.ts                 # Translation hook

  /lib                                # Utilities & configurations
    /auth
      apiAuth.ts                      # API auth helpers
      auth.ts                         # NextAuth config
    /editor
      editor.tsx                      # Tiptap editor
      text-direction.ts               # RTL/LTR direction
      /extensions
        FontSize.ts                   # Custom font size extension
        Indent.ts                     # Custom indent extension
        LineHeight.ts                 # Custom line height extension
    /email
      resend.ts                       # Email sending (Resend)
      /templates
        payment-confirmation.ts       # Payment email template
        ticket-confirmation.ts        # Ticket email template
    /embeddings
      embeddings.ts                   # AI text embeddings
    /pdf
      download-element-as-pdf.ts      # DOM-to-PDF export
      generate-ticket-pdf.ts          # Ticket PDF generation
      ticket-pdf-document.tsx         # Ticket PDF template
    /prisma
      prisma.ts                       # Prisma client singleton
      tags.ts                         # Tag helpers
    /rate-limit
      rate-limit.ts                   # API rate limiting
    /react-query
      QueryProvider.tsx               # React Query provider
    /stripe
      stripe.ts                       # Stripe helpers
    /upload
      client-upload.ts                # Client-side upload
    /utils
      categoryTree.ts                 # Category tree builder
      clipboard.ts                    # Clipboard helpers
      currency.ts                     # Currency formatting
      date.ts                         # Date formatting
      share.ts                        # Share utilities
      slug.ts                         # Slug generation
      status.ts                       # Status helpers
      stripHtml.ts                    # HTML stripping
      youtube.ts                      # YouTube URL parsing

  /locales                            # Translations
    en.json                           # English
    he.json                           # Hebrew

  /types                              # TypeScript definitions
    /About/about.ts
    /Account/account.ts
    /Activity/activity.ts
    /AI/ai-chat.ts
    /Analytics/vercel-analytics.ts
    /Archive/archive.ts
    /Articles/articles.ts
    /Auth/api-auth.ts, auth.ts
    /BottomSheet/bottom-sheet.ts
    /Breadcrumbs/breadcrumbs.ts
    /Browse/browse.ts
    /Category/category.ts
    /Comments/comments.ts
    /Components/components.ts
    /Contact/contact.ts
    /Context/category-preferences.ts
    /Dashboard/dashboard.ts
    /EditEvent/edit.d.ts
    /EditLecture/edit.d.ts
    /Editor/editor.d.ts, speech-recognition.ts, tiptap-editor.ts
    /Email/email.ts
    /Events/events.d.ts, events.ts, events-component.ts
    /Favorites/favorites.ts
    /GlobalSearch/globalsearch.d.ts
    /Home/content-card.ts, home.d.ts, home-content.ts
    /Lectures/lectures.d.ts, lectures-api.ts
    /Modal/modal.ts
    /Nav/nav.d.ts
    /NotificationContext/notification.d.ts
    /Notifications/notifications.ts
    /Presentations/presentations.d.ts, presentations.ts, presentations-api.ts
    /Quote/quote.ts
    /RateLimit/rate-limit.ts
    /SettingsContext/settings.d.ts
    /Sitemap/footer-sitemap.ts
    /SiteSettings/settings.d.ts
    /Stats/stats.ts
    /ThemeContext/theme.d.ts
    /Tickets/tickets.ts
    /Upload/upload.ts
    /User/user.ts
    /Utils/category-tree.ts
```

_Last updated: February 2026_
