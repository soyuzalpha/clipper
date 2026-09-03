"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <button
      type="button"
      aria-label="Toggle theme"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className={cn(
        "inline-flex size-7 items-center justify-center rounded-md text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors",
        className
      )}
    >
      {/* Both icons render; CSS picks — no state, no hydration mismatch. */}
      <Moon className="size-4 dark:hidden" aria-hidden />
      <Sun className="hidden size-4 dark:block" aria-hidden />
    </button>
  );
}
