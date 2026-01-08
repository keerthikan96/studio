import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { PermissionProvider } from '@/contexts/PermissionContext';

export const metadata: Metadata = {
  title: 'MDP - Modern People Management',
  description: 'Advanced HR & staff management platform with modern tools and analytics.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased" suppressHydrationWarning>
        <PermissionProvider>
          {children}
          <Toaster />
        </PermissionProvider>
      </body>
    </html>
  );
}
