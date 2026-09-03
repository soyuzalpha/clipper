"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { mainNav, secondaryNav } from "@/config/nav";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const pathname = usePathname();
  const items = [...mainNav, ...secondaryNav];

  return (
    <nav
      className="flex overflow-x-auto border-b border-border bg-background px-2 py-2 md:hidden"
      aria-label="Mobile navigation"
    >
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
            pathname === item.href
              ? "bg-muted text-foreground"
              : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
          )}
        >
          <item.icon className="size-3.5" aria-hidden />
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
