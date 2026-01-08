
'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
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
import { LayoutDashboard, Users, Briefcase, Award, Calendar as CalendarIcon, User, FileText, Search, Bell, Newspaper, Settings, ChevronDown, ClipboardList, FlaskConical, History, Folder } from "lucide-react";
import Logo from "@/components/logo";
import UserNav from "@/components/user-nav";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import Breadcrumbs from "@/components/breadcrumbs";
import { usePermissions } from "@/contexts/PermissionContext";

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const { hasPermission, hasAnyPermission, loading: permissionsLoading } = usePermissions();

  useEffect(() => {
    setIsClient(true);
    const storedUser = sessionStorage.getItem('loggedInUser');
    if (storedUser) {
        setUserRole(JSON.parse(storedUser).role);
    }
  }, []);

  const menuItems = [
    { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard, permission: null }, // No permission required for dashboard
    { 
      href: "/admin/workfeed",
      label: "Workfeed", 
      icon: Newspaper,
      permission: 'workfeed.create_post',
      subItems: [
        { href: "/admin/workfeed", label: "Posts", permission: 'workfeed.create_post' },
        { href: "/admin/workfeed/settings", label: "Settings", permission: 'workfeed.manage_automated_posts' }
      ]
    },
    { href: "/admin/calendar", label: "Calendar", icon: CalendarIcon, permission: null }, // Add calendar permission if needed
    { href: "/admin/attendance", label: "Attendance", icon: CalendarIcon, permission: null }, // Add attendance permission if needed
    { href: "/admin/department", label: "Department", icon: Briefcase, permission: null }, // Add department permission if needed
    { href: "/admin/members", label: "Members", icon: Users, permission: 'members.read_all' },    
    { href: "/admin/intake", label: "Intake", icon: ClipboardList, permission: null }, // Add intake permission if needed    
    { href: "/admin/documents", label: "Documents", icon: Folder, permission: 'documents.view_all' },
    { href: "/admin/award", label: "Award", icon: Award, permission: null }, // Add award permission if needed
    { href: "/admin/leave", label: "Leave", icon: CalendarIcon, permission: 'leave.read_all' },
    { href: "/admin/notice", label: "Notice", icon: FileText, permission: null }, // Add notice permission if needed
    { href: "/dashboard/profile", label: "Profile", icon: User, permission: null }, // No permission required for own profile
  ];
  
  // Filter menu items based on permissions - only filter when permissions are loaded
  const filteredMenuItems = isClient && !permissionsLoading ? menuItems.filter(item => {
    if (!item.permission) return true; // No permission required, always show
    
    // Check main item permission
    const hasMainPermission = hasPermission(item.permission);
    
    // If item has subItems, filter them too
    if (item.subItems) {
      const filteredSubItems = item.subItems.filter(subItem => 
        !subItem.permission || hasPermission(subItem.permission)
      );
      
      // Update item with filtered subItems
      if (filteredSubItems.length > 0) {
        return true;
      }
      return false;
    }
    
    return hasMainPermission;
  }).map(item => {
    // Filter subItems if they exist
    if (item.subItems) {
      return {
        ...item,
        subItems: item.subItems.filter(subItem => 
          !subItem.permission || hasPermission(subItem.permission)
        )
      };
    }
    return item;
  }) : menuItems; // Show all items while loading
  
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
  
  const pathSegments = pathname.split('/').filter(Boolean);
  let pageTitle = 'Dashboard'; 

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

  const canAccessSettings = isClient && !permissionsLoading ? hasAnyPermission(['roles.read', 'leave.manage_categories', 'performance.create_review_record']) : false;

  return (
    <SidebarProvider>
      <Sidebar className="border-r border-border/50 bg-card/50 backdrop-blur-sm">
        <SidebarHeader className="border-b border-border/50 p-4">
          <Link href="/admin/dashboard">
            <Logo />
          </Link>
        </SidebarHeader>
        <SidebarContent>
           <SidebarGroup>
            <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <SidebarInput placeholder="Search..." className="pl-8" />
            </div>
           </SidebarGroup>
          <SidebarMenu>
            {isClient && filteredMenuItems.map((item, index) => (
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
             {canAccessSettings && (
                  <>
                    <SidebarMenuItem>
                        <Link href="/admin/settings">
                            <SidebarMenuButton
                                isActive={pathname.startsWith('/admin/settings')}
                                tooltip={{ children: 'Settings' }}
                            >
                                <Settings />
                                <span>Settings</span>
                            </SidebarMenuButton>
                        </Link>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <Link href="/admin/audit-log">
                            <SidebarMenuButton
                                isActive={pathname.startsWith('/admin/audit-log')}
                                tooltip={{ children: 'Audit Log' }}
                            >
                                <History />
                                <span>Audit Log</span>
                            </SidebarMenuButton>
                        </Link>
                    </SidebarMenuItem>
                  </>
              )}
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-16 items-center justify-between border-b bg-card/50 backdrop-blur-sm px-6 sticky top-0 z-10 shadow-soft">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="lg:hidden" />
          </div>
           <div className="relative md:w-1/3 lg:w-1/4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search here..." className="pl-9 bg-background/50 border-border/50 focus-visible:ring-primary transition-all" />
            </div>
          <div className="flex items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="relative"
            >
              <Bell className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" />
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-destructive rounded-full text-[10px] text-white flex items-center justify-center font-semibold">3</span>
            </motion.button>
            <UserNav />
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-background via-primary/[0.02] to-accent/[0.02] relative overflow-hidden">
            {/* Ambient background effects */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
            </div>
            
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="mb-6 relative z-10"
            >
              <div className="flex items-center gap-3 mb-2">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
                  className="w-1 h-8 bg-gradient-to-b from-primary to-accent rounded-full"
                />
                <h1 className="text-3xl font-bold tracking-tight text-foreground">
                  {pageTitle}
                </h1>
              </div>
               {isClient && <Breadcrumbs />}
            </motion.div>
            <AnimatePresence mode="wait">
              <motion.div
                key={pathname}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="relative z-10"
              >
                {children}
              </motion.div>
            </AnimatePresence>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
