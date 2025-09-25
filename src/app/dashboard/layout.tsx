'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
  SidebarInput,
} from "@/components/ui/sidebar";
import { LayoutDashboard, Users, Newspaper, User, Search, Bell } from "lucide-react";
import Logo from "@/components/logo";
import UserNav from "@/components/user-nav";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import Breadcrumbs from "@/components/breadcrumbs";

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const menuItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/members", label: "Members", icon: Users },
    { href: "/dashboard/workfeed", label: "Workfeed", icon: Newspaper },
    { href: "/dashboard/profile", label: "My Profile", icon: User },
  ];
  
  const getIsActive = (href: string) => {
     if (href === '/dashboard' && pathname !== '/dashboard') {
         return false;
     }
     return pathname.startsWith(href);
  }

  const pathSegments = pathname.split('/').filter(Boolean);
  let pageTitle = 'Dashboard';

  if (pathSegments.length > 1) {
    const lastSegment = pathSegments[pathSegments.length - 1];
    if (pathSegments[1] === 'members' && pathSegments.length > 2 && lastSegment !== 'members') {
        pageTitle = 'Member Profile';
    } else {
        pageTitle = capitalize(lastSegment.replace(/-/g, ' '));
    }
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <Logo />
        </SidebarHeader>
        <SidebarContent>
           <SidebarMenu>
            {isClient && menuItems.map((item, index) => (
                <SidebarMenuItem key={index}>
                    <Link href={item.href}>
                        <SidebarMenuButton
                            isActive={getIsActive(item.href)}
                            tooltip={{ children: item.label }}
                        >
                            <item.icon />
                            <span>{item.label}</span>
                        </SidebarMenuButton>
                    </Link>
                </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-16 items-center justify-between border-b bg-background px-6">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="lg:hidden" />
            <h1 className="text-xl font-bold tracking-tight">{pageTitle}</h1>
          </div>
          <div className="flex items-center gap-4">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <UserNav />
          </div>
        </header>
        <main className="flex-1 p-6 bg-muted/30">
            {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
