import { NavItem } from "@/types/Nav/nav";

export const navItems: NavItem[] = [
  { label: "nav.articles", href: "/articles" },
  { label: "nav.presentations", href: "/presentations" },
  { label: "nav.lectures", href: "/lectures" },
  { label: "nav.contact", href: "/contact" },
  { label: "nav.events", href: "/events" },
  {
    label: "nav.onlineEvents",
    href: "/online",
    className: "text-blue-500 font-semibold",
  },
];
