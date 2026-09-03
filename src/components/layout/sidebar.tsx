"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { mainNav, secondaryNav } from "@/config/nav";
import { ThemeToggle } from "./theme-toggle";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:w-56 md:flex-col md:border-r md:border-border bg-sidebar">
      <div className="flex h-14 items-center border-b border-border px-4">
        <Link href="/" className="text-lg font-semibold tracking-tight text-sidebar-foreground">
          Clipper OS
        </Link>
      </div>
      <nav className="flex-1 overflow-y-auto px-2 py-2" aria-label="Main navigation">
        <ul className="space-y-0.5">
          {mainNav.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors",
                  pathname === item.href
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )}
              >
                <item.icon className="size-4 shrink-0" aria-hidden />
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className="border-t border-border px-2 py-2">
        <ul className="space-y-0.5">
          {secondaryNav.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors",
                  pathname === item.href
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )}
              >
                <item.icon className="size-4 shrink-0" aria-hidden />
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
        <div className="mt-1 flex items-center justify-end px-1">
          <ThemeToggle />
        </div>
      </div>
    </aside>
  );
}