
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

const breadcrumbNameMap: { [key: string]: string } = {
    'admin': 'Home',
    'add-staff': 'Add Member'
};


export default function Breadcrumbs() {
  const pathname = usePathname();
  const pathSegments = pathname.split('/').filter(Boolean);

  // Don't show breadcrumbs on root admin pages like /admin/dashboard
  if (pathSegments.length <= 1 || (pathSegments.length === 2 && pathSegments[1] === 'dashboard')) {
    return null;
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/admin/dashboard">Home</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />

        {pathSegments.slice(1, -1).map((segment, index) => {
           const href = `/${pathSegments.slice(0, index + 2).join('/')}`;
           const segmentName = breadcrumbNameMap[segment] || capitalize(segment.replace(/-/g, ' '));
          
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
                let segmentName = breadcrumbNameMap[lastSegment] || capitalize(lastSegment.replace(/-/g, ' '));
                
                // Check if it's a members profile page
                if (pathSegments.length > 2 && pathSegments[1] === 'members') {
                    segmentName = 'Profile';
                }
                
                return <BreadcrumbPage>{segmentName}</BreadcrumbPage>;
            })()}
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}
