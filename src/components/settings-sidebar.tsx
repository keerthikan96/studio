
'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronRight, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const settingsModules = [
  {
    title: "Module Management",
    subItems: [
      { name: "Module List", href: "/admin/settings/module-management/list", isCritical: true },
      { name: "Module Configuration", href: "/admin/settings/module-management/configuration", isCritical: true },
    ],
  },
  {
    title: "Home Module Management",
    subItems: [
      { name: "Carousel Management", href: "/admin/settings/home/carousel", isCritical: true },
      { name: "Dashboard Management", href: "/admin/settings/home/dashboard", isCritical: true },
    ],
  },
    {
    title: "Role Management",
    subItems: [
      { name: "Roles & Permissions", href: "/admin/settings/user-management/roles", isCritical: true },
    ],
  },
];

const SubItem = ({ name, href, isCritical }: { name: string; href: string; isCritical: boolean; }) => {
    const pathname = usePathname();
    const isActive = pathname === href;
    return (
        <Link href={href}>
            <div className={cn(
                "flex items-center justify-between p-2 rounded-md hover:bg-muted text-sm",
                isActive && "bg-muted font-semibold"
            )}>
                <span className="flex items-center">
                    {name}
                    {isCritical && <span className="ml-2 w-2 h-2 rounded-full bg-red-500" title="Critical"></span>}
                </span>
            </div>
        </Link>
    )
}

export function SettingsSidebar() {
  const pathname = usePathname();
  const isSettingsHome = pathname === '/admin/settings';

  const isModuleActive = (pathSegment: string) => pathname.includes(pathSegment);

  return (
    <aside className="w-80 flex-shrink-0 border-r p-4 space-y-4">
        <h2 className="text-xl font-bold tracking-tight mb-4 flex items-center gap-2"><Settings /> Settings</h2>
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
                {module.title}
                <ChevronRight className="h-4 w-4 transition-transform group-data-[state=open]:rotate-90" />
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-1 pl-4 pt-2">
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
