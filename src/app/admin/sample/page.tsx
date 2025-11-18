'use client';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarProvider,
  SidebarTrigger,
  SidebarFooter,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import {
  Home,
  Users,
  Settings,
  MoreHorizontal,
  ChevronRight,
  Shield,
  File,
  Calendar,
  LogOut,
  FlaskConical,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import Logo from '@/components/logo';

export default function SamplePage() {
  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm min-h-[calc(100vh-theme(spacing.16)-theme(spacing.12))]">
      <SidebarProvider>
        <Sidebar>
          <SidebarHeader>
            <Logo />
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton href="/admin/dashboard" isActive>
                  <Home />
                  <span>Dashboard</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton href="#">
                  <Users />
                  <span>Users</span>
                  <SidebarMenuBadge>12</SidebarMenuBadge>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton href="#">
                  <Calendar />
                  <span>Calendar</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
            <SidebarSeparator />
            <SidebarGroup>
              <SidebarGroupLabel>Projects</SidebarGroupLabel>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton>
                    <File />
                    <span>Project Alpha</span>
                    <SidebarMenuAction>
                      <MoreHorizontal />
                    </SidebarMenuAction>
                  </SidebarMenuButton>
                  <SidebarMenuSub>
                    <SidebarMenuSubButton href="#">
                      Overview
                    </SidebarMenuSubButton>
                    <SidebarMenuSubButton href="#">
                      Tasks
                    </SidebarMenuSubButton>
                    <SidebarMenuSubButton href="#">
                      Files
                    </SidebarMenuSubButton>
                  </SidebarMenuSub>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton>
                    <File />
                    <span>Project Gamma</span>
                    <SidebarMenuAction>
                      <MoreHorizontal />
                    </SidebarMenuAction>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <div className="flex items-center gap-2">
                    <Avatar className="size-7">
                      <AvatarImage src="https://i.pravatar.cc/40?u=admin" />
                      <AvatarFallback>A</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold">Admin</span>
                      <span className="text-xs text-muted-foreground">
                        admin@mdp.com
                      </span>
                    </div>
                  </div>
                  <LogOut />
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset>
            <header className="flex h-16 items-center justify-between border-b bg-background px-6">
                <div className="flex items-center gap-4">
                    <SidebarTrigger className="lg:hidden" />
                    <h1 className="text-xl font-bold">Sample Page</h1>
                </div>
            </header>
            <main className="flex-1 p-6">
                <h2 className="text-2xl font-bold mb-4">Sidebar Component Showcase</h2>
                <p className="text-muted-foreground">This page demonstrates the various components available for building a sidebar.</p>
                <p className="text-muted-foreground mt-2">Resize your browser window or click the toggle button to see the responsive behavior.</p>
            </main>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
