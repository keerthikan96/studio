
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
  SidebarGroup,
  SidebarMenuSub,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar";
import { LayoutDashboard, Users, Briefcase, Award, Calendar, User, FileText, Search, Bell, Newspaper, Settings, ChevronDown } from "lucide-react";
import Logo from "@/components/logo";
import UserNav from "@/components/user-nav";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export default function AdminLayout({
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
    { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { 
      label: "Workfeed", 
      icon: Newspaper,
      subItems: [
        { href: "/admin/workfeed", label: "Posts" },
        { href: "/admin/workfeed/settings", label: "Settings" }
      ]
    },
    { href: "/admin/attendance", label: "Attendance", icon: Calendar },
    { href: "/admin/department", label: "Department", icon: Briefcase },
    { href: "/admin/members", label: "Members", icon: Users },
    { href: "/admin/award", label: "Award", icon: Award },
    { href: "/admin/leave", label: "Leave", icon: Calendar },
    { href: "/admin/notice", label: "Notice", icon: FileText },
    { href: "/admin/profile", label: "Profile", icon: User },
  ];

  const getIsActive = (href: string) => {
     if (href === '/admin/members') {
        return pathname.startsWith("/admin/members") || pathname === "/admin/add-staff";
     }
     if (href === '/admin/workfeed/settings') {
        return pathname.startsWith('/admin/workfeed/settings');
     }
     if (href === '/admin/workfeed') {
        return pathname === '/admin/workfeed';
     }
     return pathname === href;
  }
  
  const isWorkfeedActive = pathname.startsWith('/admin/workfeed');

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <Logo />
        </SidebarHeader>
        <SidebarContent>
           <SidebarGroup>
            <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <SidebarInput placeholder="Search..." className="pl-8" />
            </div>
           </SidebarGroup>
          <SidebarMenu>
            {isClient && menuItems.map((item, index) => (
                <SidebarMenuItem key={index}>
                {item.subItems ? (
                  <Collapsible defaultOpen={isWorkfeedActive}>
                    <CollapsibleTrigger asChild>
                       <SidebarMenuButton
                          isActive={isWorkfeedActive}
                          tooltip={{ children: item.label }}
                          className="justify-between"
                        >
                          <div className="flex items-center gap-2">
                             <item.icon />
                             <span>{item.label}</span>
                          </div>
                          <ChevronDown className="h-4 w-4 transition-transform [&[data-state=open]]:rotate-180" />
                        </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                        <SidebarMenuSub>
                          {item.subItems.map(subItem => (
                             <SidebarMenuItem key={subItem.href}>
                                <SidebarMenuSubButton asChild isActive={pathname === subItem.href}>
                                  <Link href={subItem.href}>
                                    {subItem.label}
                                  </Link>
                                </SidebarMenuSubButton>
                              </SidebarMenuItem>
                          ))}
                        </SidebarMenuSub>
                    </CollapsibleContent>
                  </Collapsible>
                ) : (
                    <Link href={item.href!}>
                        <SidebarMenuButton
                        isActive={getIsActive(item.href!)}
                        tooltip={{ children: item.label }}
                        >
                        <item.icon />
                        <span>{item.label}</span>
                        </SidebarMenuButton>
                    </Link>
                )}
                </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-16 items-center justify-between border-b bg-background px-6">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="lg:hidden" />
            <h1 className="text-xl font-semibold">Dashboard</h1>
          </div>
           <div className="relative md:w-1/3 lg:w-1/4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search here..." className="pl-9 bg-muted border-none focus-visible:ring-primary" />
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
