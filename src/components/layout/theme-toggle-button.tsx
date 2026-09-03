"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function ThemeToggleButton() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            aria-label="Toggle theme"
            onClick={() =>
              setTheme(resolvedTheme === "dark" ? "light" : "dark")
            }
          />
        }
      >
        {/* Both icons render; CSS picks — no state, no hydration mismatch. */}
        <Moon className="size-4 dark:hidden" aria-hidden />
        <Sun className="hidden size-4 dark:block" aria-hidden />
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <p>Switch to {resolvedTheme === "dark" ? "light" : "dark"} theme</p>
      </TooltipContent>
    </Tooltip>
  );
}
