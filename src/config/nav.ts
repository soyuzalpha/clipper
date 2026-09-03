import {
  LayoutDashboard,
  Target,
  Lightbulb,
  CalendarDays,
  Clapperboard,
  Scissors,
  FolderOpen,
  Sparkles,
  Settings,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const mainNav: NavItem[] = [
  { label: "Overview", href: "/", icon: LayoutDashboard },
  { label: "Campaigns", href: "/campaigns", icon: Target },
  { label: "Content Ideas", href: "/ideas", icon: Lightbulb },
  { label: "Planner", href: "/planner", icon: CalendarDays },
  { label: "Production", href: "/production", icon: Clapperboard },
  { label: "Clip Maker", href: "/clips", icon: Scissors },
  { label: "Content Library", href: "/library", icon: FolderOpen },
  { label: "AI Assistant", href: "/assistant", icon: Sparkles },
];

export const secondaryNav: NavItem[] = [
  { label: "Settings", href: "/settings", icon: Settings },
];
