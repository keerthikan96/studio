
'use client';

import React, { useEffect, useState } from 'react';
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

// Helper to check if a string looks like a UUID
const isUUID = (str: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

export default function Breadcrumbs() {
  const pathname = usePathname();
  const pathSegments = pathname.split('/').filter(Boolean);
  const [dynamicNames, setDynamicNames] = useState<{ [key: string]: string }>({});

  // Don't show breadcrumbs on root admin pages like /admin/dashboard
  if (pathSegments.length <= 1 || (pathSegments.length === 2 && pathSegments[1] === 'dashboard')) {
    return null;
  }

  useEffect(() => {
    const fetchDynamicNames = async () => {
      const names: { [key: string]: string } = {};
      
      for (let i = 0; i < pathSegments.length; i++) {
        const segment = pathSegments[i];
        const prevSegment = i > 0 ? pathSegments[i - 1] : null;
        
        // Check if this looks like a UUID and fetch its name
        if (isUUID(segment) && prevSegment) {
          try {
            let name = '';
            
            // Fetch department name
            if (prevSegment === 'department') {
              const response = await fetch(`/api/departments`);
              if (response.ok) {
                const departments = await response.json();
                const department = departments.find((d: any) => d.id === segment);
                if (department) {
                  name = department.name;
                }
              }
            }
            
            // Fetch role name
            else if (prevSegment === 'roles') {
              const storedUser = sessionStorage.getItem('loggedInUser');
              const currentUserId = storedUser ? JSON.parse(storedUser).id : '';
              
              const response = await fetch(`/api/roles?userId=${currentUserId}`);
              if (response.ok) {
                const roles = await response.json();
                const role = roles.find((r: any) => r.id === segment);
                if (role) {
                  name = role.name;
                }
              }
            }
            
            if (name) {
              names[segment] = name;
            }
          } catch (error) {
            console.error(`Failed to fetch name for ${prevSegment}/${segment}:`, error);
          }
        }
      }
      
      setDynamicNames(names);
    };

    fetchDynamicNames();
  }, [pathname]);

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
           let segmentName = breadcrumbNameMap[segment] || capitalize(segment.replace(/-/g, ' '));
           
           // Use dynamic name if available
           if (dynamicNames[segment]) {
             segmentName = dynamicNames[segment];
           }
          
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
                
                // Use dynamic name if available
                if (dynamicNames[lastSegment]) {
                  segmentName = dynamicNames[lastSegment];
                }
                
                return <BreadcrumbPage>{segmentName}</BreadcrumbPage>;
            })()}
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}
