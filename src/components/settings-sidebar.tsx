
'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronRight, Settings, Users, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

const settingsModules = [
  {
    title: "User Management",
    isCollapsible: true,
    icon: Users,
    subItems: [
      { name: "Roles & Permissions", href: "/admin/settings/user-management/roles" },
    ],
  },
  {
    title: "Module Management",
    isCollapsible: true,
    icon: Settings,
    subItems: [
      { name: "Module List", href: "/admin/settings/module-management/list" },
      { name: "Configuration", href: "/admin/settings/module-management/configuration" },
    ],
  },
  {
    title: "Home Module",
    isCollapsible: true,
    icon: Settings,
    subItems: [
      { name: "Carousel", href: "/admin/settings/home/carousel" },
      { name: "Dashboard", href: "/admin/settings/home/dashboard" },
    ],
  },
    {
    title: "Assessment Management",
    isCollapsible: true,
    icon: Settings,
    subItems: [
      { name: "Categories", href: "/admin/settings/assessment/categories" },
    ],
  },
  {
    title: "Leave Management",
    isCollapsible: true,
    icon: Settings,
    subItems: [
      { name: "Leave Requests", href: "/admin/settings/leave" },
    ],
  }
];

const SubItem = ({ name, href }: { name: string; href: string; }) => {
    const pathname = usePathname();
    const isActive = pathname === href;
    return (
        <Link href={href}>
            <div className={cn(
                "flex items-center justify-between p-2 rounded-md hover:bg-muted text-sm",
                isActive && "bg-muted font-semibold"
            )}>
                <span>{name}</span>
            </div>
        </Link>
    )
}

export function SettingsSidebar() {
  const pathname = usePathname();
  const isSettingsHome = pathname === '/admin/settings';

  const isModuleActive = (pathSegment: string) => pathname.includes(pathSegment);

  return (
    <aside className="w-full md:w-80 md:flex-shrink-0 md:border-r p-4 space-y-4 h-full overflow-y-auto">
        <h2 className="text-xl font-bold tracking-tight mb-4 flex items-center gap-2"><Shield /> Security & Settings</h2>
      <nav className="flex flex-col gap-1">
        <Link href="/admin/settings">
            <div className={cn(
                "flex items-center justify-between p-2 rounded-md hover:bg-muted font-semibold",
                isSettingsHome && "bg-muted"
            )}>
                General
            </div>
        </Link>

        {settingsModules.map((module) => (
          <Collapsible key={module.title} defaultOpen={isModuleActive(module.subItems[0].href.split('/')[3])}>
            <CollapsibleTrigger className="flex w-full items-center justify-between p-2 rounded-md hover:bg-muted font-semibold group">
                 <div className="flex items-center gap-2">
                    <module.icon className="h-4 w-4" />
                    {module.title}
                 </div>
                <ChevronRight className="h-4 w-4 transition-transform group-data-[state=open]:rotate-90" />
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-1 pl-8 pt-2">
                {module.subItems.map(item => (
                    <SubItem key={item.name} {...item} />
                ))}
            </CollapsibleContent>
          </Collapsible>
        ))}
      </nav>
    </aside>
  );
}
