
'use client';

import { useState } from "react";
import { SettingsSidebar } from "@/components/settings-sidebar";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex flex-col md:flex-row min-h-[calc(100vh-theme(spacing.16)-theme(spacing.12))] rounded-lg border bg-card text-card-foreground shadow-sm">
      {/* Mobile Header with Hamburger Menu */}
      <div className="md:hidden flex items-center justify-between p-4 border-b">
        <h2 className="text-xl font-bold">Settings Menu</h2>
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Open settings menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-80">
            <SettingsSidebar />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <SettingsSidebar />
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8">
        {children}
      </div>
    </div>
  );
}
