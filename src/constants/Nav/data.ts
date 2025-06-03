import { NavItem } from "@/types/Nav/nav";

export const navItems: NavItem[] = [
  { label: "Presentations", href: "/presentations" },
  { label: "Articles", href: "/articles-demo" },
  { label: "Lectures", href: "/lectures" },
  { label: "Contact", href: "/contact" },
  { label: "Events", href: "/events" },
  {
    label: "Online Events",
    href: "/online",
    className: "text-blue-500 font-semibold",
  },
];
