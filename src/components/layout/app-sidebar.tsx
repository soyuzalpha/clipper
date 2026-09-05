"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { mainNav, type NavItem } from "@/config/nav";
import { NavUser } from "./nav-user";
import Image from "next/image";

function NavButton({ item }: { item: NavItem }) {
  const pathname = usePathname();
  const isActive = pathname === item.href;

  return (
    <SidebarMenuButton
      size={"default"}
      render={<Link href={item.href} />}
      isActive={isActive}
      tooltip={item.label}
      className="p-4"
    >
      <item.icon aria-hidden />
      <span>{item.label}</span>
    </SidebarMenuButton>
  );
}

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  user: { name?: string | null; email?: string | null };
};

export function AppSidebar({ user, ...props }: AppSidebarProps) {
  return (
    <Sidebar collapsible="icon" {...props} variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link href="/" />}>
              <img src={"/logo.png"} alt="logo" />
              <span className="text-sm font-semibold tracking-tight uppercase">Clipper</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNav.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <NavButton item={item} />
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
