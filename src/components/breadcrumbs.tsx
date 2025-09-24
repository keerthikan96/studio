
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

// Helper function to capitalize the first letter of a string
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export default function Breadcrumbs() {
  const pathname = usePathname();
  const pathSegments = pathname.split('/').filter(Boolean);

  // Don't show breadcrumbs on root admin pages like /admin/dashboard
  if (pathSegments.length <= 2) {
    return null;
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {pathSegments.slice(0, -1).map((segment, index) => {
          const href = `/${pathSegments.slice(0, index + 1).join('/')}`;
          const segmentName = capitalize(segment.replace(/-/g, ' '));
          
          return (
            <React.Fragment key={href}>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href={href}>{segmentName}</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
            </React.Fragment>
          );
        })}
        
        <BreadcrumbItem>
            {(() => {
                const lastSegment = pathSegments[pathSegments.length - 1];
                const segmentName = lastSegment.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i) 
                    ? 'Profile' 
                    : capitalize(lastSegment.replace(/-/g, ' '));
                 if (pathname === '/admin/add-staff') {
                   return <BreadcrumbPage>Add Member</BreadcrumbPage>;
                 }
                return <BreadcrumbPage>{segmentName}</BreadcrumbPage>;
            })()}
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}
