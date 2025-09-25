
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
import { LayoutDashboard, Users, Briefcase, Award, Calendar as CalendarIcon, User, FileText, Search, Bell, Newspaper, Settings, ChevronDown, ClipboardList } from "lucide-react";
import Logo from "@/components/logo";
import UserNav from "@/components/user-nav";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import Breadcrumbs from "@/components/breadcrumbs";

// Helper function to capitalize the first letter of a string
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

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
    { href: "/admin/calendar", label: "Calendar", icon: CalendarIcon },
    { 
      label: "On-boarding Management",
      icon: ClipboardList,
      subItems: [
        { href: "/admin/intake/list", label: "On-boarding List" },
        { href: "/admin/intake/new", label: "New On-boarding" },
        { href: "/admin/intake/configuration", label: "On-boarding Configuration" }
      ]
    },
    { href: "/admin/attendance", label: "Attendance", icon: CalendarIcon },
    { href: "/admin/department", label: "Department", icon: Briefcase },
    { href: "/admin/members", label: "Members", icon: Users },
    { href: "/admin/award", label: "Award", icon: Award },
    { href: "/admin/leave", label: "Leave", icon: CalendarIcon },
    { href: "/admin/notice", label: "Notice", icon: FileText },
    { href: "/dashboard/profile", label: "Profile", icon: User },
  ];

  const getIsActive = (href: string, subItems?: any[]) => {
     if (subItems) {
       return subItems.some(item => pathname.startsWith(item.href));
     }
     if (href === '/admin/members') {
        return pathname.startsWith("/admin/members") || pathname === "/admin/add-staff";
     }
     if (href === '/dashboard/profile') {
        return pathname.startsWith('/dashboard/profile');
     }
     return pathname === href;
  }
  
  const isWorkfeedActive = pathname.startsWith('/admin/workfeed');
  const isIntakeActive = pathname.startsWith('/admin/intake');

  // Logic to generate page title
  const pathSegments = pathname.split('/').filter(Boolean);
  let pageTitle = 'Dashboard'; // Default title

  if (pathSegments.length > 1) {
    const lastSegment = pathSegments[pathSegments.length - 1];
    if (pathSegments[1] === 'members' && pathSegments.length > 2) {
        pageTitle = 'Profile';
    } else {
        pageTitle = capitalize(lastSegment.replace(/-/g, ' '));
    }
  }
  if (pathname === '/admin/add-staff') {
    pageTitle = 'Add Member';
  }
   if (pathname === '/admin/dashboard') {
    pageTitle = 'Dashboard';
  }


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
                  <Collapsible defaultOpen={getIsActive(item.href!, item.subItems)}>
                    <CollapsibleTrigger asChild>
                       <SidebarMenuButton
                          isActive={getIsActive(item.href!, item.subItems)}
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
                                <SidebarMenuSubButton asChild isActive={pathname.startsWith(subItem.href)}>
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
            <div className="mb-4">
              <h1 className="text-2xl font-bold tracking-tight mb-2">{pageTitle}</h1>
               {isClient && <Breadcrumbs />}
            </div>
            {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
