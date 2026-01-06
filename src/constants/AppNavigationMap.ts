// This constant provides context to the AI assistant about all app features and navigation
// Used to help users find their way around the application

export const APP_NAVIGATION_MAP = {
  adminPanel: {
    path: "/elitzur",
    description: "Admin panel for managing all content",
    tabs: [
      {
        key: "user",
        label: "User / משתמש פעיל",
        description: "View login status, quick stats, and recent activity",
      },
      {
        key: "home",
        label: "Home Page / דף הבית",
        description: "Manage homepage content and hero section",
      },
      {
        key: "categories",
        label: "Categories / קטגוריות",
        description: "Create, edit, and delete article categories",
      },
      {
        key: "articles",
        label: "Articles / מאמרים",
        description: "Create, edit, and manage articles",
        actions: ["Create new article", "Edit existing articles", "Delete articles"],
      },
      {
        key: "events",
        label: "Events / אירועים",
        description: "Create, edit, and manage events",
        actions: ["Create new event", "Edit existing events", "Delete events"],
      },
      {
        key: "lectures",
        label: "Lectures / הרצאות",
        description: "Create, edit, and manage video lectures",
        actions: ["Create new lecture", "Edit existing lectures", "Delete lectures"],
      },
      {
        key: "presentations",
        label: "Presentations / מצגות",
        description: "Create, edit, and manage presentations",
        actions: ["Create new presentation", "Edit existing presentations", "Delete presentations"],
      },
      {
        key: "messages",
        label: "Messages / הודעות",
        description: "View and manage contact form submissions",
      },
      {
        key: "settings",
        label: "System Settings / הגדרות מערכת",
        description: "Configure site-wide settings",
      },
    ],
  },
  publicPages: [
    { path: "/", label: "Home", description: "Main landing page" },
    { path: "/lectures", label: "Lectures", description: "Browse all video lectures" },
    { path: "/presentations", label: "Presentations", description: "Browse all presentations" },
    { path: "/events", label: "Events", description: "Browse upcoming and past events" },
    { path: "/articles", label: "Articles", description: "Browse all articles" },
    { path: "/search", label: "Search", description: "Search across all content" },
    { path: "/contact", label: "Contact", description: "Contact form page" },
  ],
  quickActions: [
    {
      action: "Create a new lecture",
      steps: [
        "Go to Admin Panel (/elitzur)",
        "Click on 'הרצאות' (Lectures) in the navigation",
        "Click the blue 'הרצאה חדשה' (New Lecture) button",
        "Fill in the lecture details and save",
      ],
      directPath: "/create-lecture",
    },
    {
      action: "Create a new presentation",
      steps: [
        "Go to Admin Panel (/elitzur)",
        "Click on 'מצגות' (Presentations) in the navigation",
        "Click the blue 'מצגת חדשה' (New Presentation) button",
        "Fill in the presentation details and save",
      ],
      directPath: "/create-presentation",
    },
    {
      action: "Create a new event",
      steps: [
        "Go to Admin Panel (/elitzur)",
        "Click on 'אירועים' (Events) in the navigation",
        "Click the blue 'אירוע חדש' (New Event) button",
        "Fill in the event details and save",
      ],
      directPath: "/create-event",
    },
    {
      action: "Create a new article",
      steps: [
        "Go to Admin Panel (/elitzur)",
        "Click on 'מאמרים' (Articles) in the navigation",
        "Click the 'מאמר חדש' (New Article) button",
        "Fill in the article details and save",
      ],
      directPath: "/articles/create",
    },
    {
      action: "Create a new category",
      steps: [
        "Go to Admin Panel (/elitzur)",
        "Click on 'קטגוריות' (Categories) in the navigation",
        "Use the form to add a new category",
      ],
    },
    {
      action: "View messages/contact submissions",
      steps: [
        "Go to Admin Panel (/elitzur)",
        "Click on 'הודעות' (Messages) in the navigation",
        "View and manage all contact form submissions",
      ],
    },
    {
      action: "Change site settings",
      steps: [
        "Go to Admin Panel (/elitzur)",
        "Click on 'הגדרות מערכת' (System Settings) in the navigation",
        "Modify the desired settings and save",
      ],
    },
  ],
  userSettings: {
    location: "Settings drawer (gear icon in header)",
    options: [
      "Language toggle (Hebrew/English)",
      "Theme toggle (Light/Dark/System)",
      "Font size (Small/Medium/Large)",
      "Reduce motion toggle",
      "Default view (Grid/List)",
    ],
  },
};

export type AppNavigationMap = typeof APP_NAVIGATION_MAP;
