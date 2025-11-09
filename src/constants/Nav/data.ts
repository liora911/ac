import { NavItem } from "@/types/Nav/nav";

export const navItems: NavItem[] = [
  { label: "nav.articles", href: "/articles", icon: "ArticleIcon" },
  {
    label: "nav.presentations",
    href: "/presentations",
    icon: "PresentationIcon",
  },
  { label: "nav.lectures", href: "/lectures", icon: "LectureIcon" },
  { label: "nav.events", href: "/events", icon: "EventIcon" },
  { label: "nav.contact", href: "/contact", icon: "ContactIcon" },
];
