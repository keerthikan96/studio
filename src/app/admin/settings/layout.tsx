
import { SettingsSidebar } from "@/components/settings-sidebar";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[calc(100vh-theme(spacing.16)-theme(spacing.12))] rounded-lg border bg-card text-card-foreground shadow-sm">
      <SettingsSidebar />
      <div className="flex-1 p-8">
        {children}
      </div>
    </div>
  );
}
