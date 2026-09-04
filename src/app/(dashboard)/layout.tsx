import { AppSidebar } from "@/components/layout/app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeToggleButton } from "@/components/layout/theme-toggle-button";
import { Button } from "@/components/ui/button";
import { BookOpen } from "lucide-react";
import Link from "next/link";
import { auth } from "@/lib/auth";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <TooltipProvider>
      <SidebarProvider className="h-svh">
        <AppSidebar user={session?.user ?? {}} />
        <SidebarInset>
          <header className="flex h-12 shrink-0 items-center justify-between gap-2 border-b border-border px-4">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-1 h-10" />
              <span className="text-sm font-medium text-muted-foreground">Clipper</span>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggleButton />
              <Link href={"/guide"} className="cursor-pointer">
                <Button type="button" size={"sm"} variant={"outline"}>
                  <BookOpen /> Guide
                </Button>
              </Link>
            </div>
          </header>
          <div className="flex-1 overflow-y-auto px-4 py-2 sm:px-6">
            <div className="mx-auto container">{children}</div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
