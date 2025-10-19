import { NavItem } from "@/types/Nav/nav";

export const navItems: NavItem[] = [
  { label: "nav.articles", href: "/articles", icon: "ArticleIcon" },
  {
    label: "nav.presentations",
    href: "/presentations",
    icon: "PresentationIcon",
  },
  { label: "nav.lectures", href: "/lectures", icon: "LectureIcon" },
  { label: "nav.contact", href: "/contact", icon: "ContactIcon" },
  { label: "nav.events", href: "/events", icon: "EventIcon" },
  {
    label: "nav.onlineEvents",
    href: "/online",
    className: "text-blue-500 font-semibold",
    icon: "OnlineEventIcon",
  },
];
