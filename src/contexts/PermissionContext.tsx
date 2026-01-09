'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface PermissionContextType {
  permissions: string[];
  loading: boolean;
  hasPermission: (permissionId: string) => boolean;
  hasAnyPermission: (permissionIds: string[]) => boolean;
  hasAllPermissions: (permissionIds: string[]) => boolean;
  refreshPermissions: () => Promise<void>;
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

interface PermissionProviderProps {
  children: ReactNode;
  userId?: string;
}

export function PermissionProvider({ children, userId }: PermissionProviderProps) {
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>(userId);

  const fetchPermissions = async () => {
    try {
      setLoading(true);
      
      // Get userId from session storage if not provided
      let userIdToUse = currentUserId || userId;
      
      if (!userIdToUse && typeof window !== 'undefined') {
        const storedUser = sessionStorage.getItem('loggedInUser');
        if (storedUser) {
          try {
            const user = JSON.parse(storedUser);
            userIdToUse = user.id;
            setCurrentUserId(user.id);
          } catch (e) {
            console.error('Error parsing logged in user:', e);
          }
        }
      }
      
      if (!userIdToUse) {
        setPermissions([]);
        setLoading(false);
        return;
      }

      // Fetch permissions from the server
      const response = await fetch(`/api/permissions?userId=${userIdToUse}`);
      
      if (response.ok) {
        const data = await response.json();
        setPermissions(data.permissions || []);
      } else {
        console.error('Failed to fetch permissions:', response.status);
        setPermissions([]);
      }
    } catch (error) {
      console.error('❌ Error fetching permissions:', error);
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch on mount
  useEffect(() => {
    fetchPermissions();
  }, []);

  // Listen for changes when userId prop changes
  useEffect(() => {
    if (userId) {
      setCurrentUserId(userId);
      fetchPermissions();
    }
  }, [userId]);

  // Listen for storage events (for cross-tab updates)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'loggedInUser' && e.newValue) {
        try {
          const user = JSON.parse(e.newValue);
          setCurrentUserId(user.id);
          fetchPermissions();
        } catch (error) {
          console.error('Error parsing storage event:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const hasPermission = (permissionId: string): boolean => {
    return permissions.includes(permissionId);
  };

  const hasAnyPermission = (permissionIds: string[]): boolean => {
    return permissionIds.some(id => permissions.includes(id));
  };

  const hasAllPermissions = (permissionIds: string[]): boolean => {
    return permissionIds.every(id => permissions.includes(id));
  };

  const value: PermissionContextType = {
    permissions,
    loading,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    refreshPermissions: fetchPermissions,
  };

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
}

/**
 * Hook to access permission context
 * @throws Error if used outside of PermissionProvider
 */
export function usePermissions(): PermissionContextType {
  const context = useContext(PermissionContext);
  
  if (context === undefined) {
    throw new Error('usePermissions must be used within a PermissionProvider');
  }
  
  return context;
}

/**
 * Hook to check if user has a specific permission
 * @param permissionId - The permission ID to check
 * @returns Object with hasPermission boolean and loading state
 */
export function useHasPermission(permissionId: string): { hasPermission: boolean; loading: boolean } {
  const { permissions, loading } = usePermissions();
  
  return {
    hasPermission: permissions.includes(permissionId),
    loading,
  };
}

/**
 * Hook to check if user has any of the specified permissions
 * @param permissionIds - Array of permission IDs to check
 * @returns Object with hasPermission boolean and loading state
 */
export function useHasAnyPermission(permissionIds: string[]): { hasPermission: boolean; loading: boolean } {
  const { permissions, loading } = usePermissions();
  
  return {
    hasPermission: permissionIds.some(id => permissions.includes(id)),
    loading,
  };
}

/**
 * Hook to check if user has all of the specified permissions
 * @param permissionIds - Array of permission IDs to check
 * @returns Object with hasPermission boolean and loading state
 */
export function useHasAllPermissions(permissionIds: string[]): { hasPermission: boolean; loading: boolean } {
  const { permissions, loading } = usePermissions();
  
  return {
    hasPermission: permissionIds.every(id => permissions.includes(id)),
    loading,
  };
}

/**
 * Component to conditionally render children based on permissions
 */
interface PermissionGateProps {
  children: ReactNode;
  permission?: string;
  anyPermission?: string[];
  allPermissions?: string[];
  fallback?: ReactNode;
}

export function PermissionGate({
  children,
  permission,
  anyPermission,
  allPermissions,
  fallback = null,
}: PermissionGateProps) {
  const { permissions, loading } = usePermissions();

  if (loading) {
    return <>{fallback}</>;
  }

  let hasAccess = false;

  if (permission) {
    hasAccess = permissions.includes(permission);
  } else if (anyPermission && anyPermission.length > 0) {
    hasAccess = anyPermission.some(id => permissions.includes(id));
  } else if (allPermissions && allPermissions.length > 0) {
    hasAccess = allPermissions.every(id => permissions.includes(id));
  }

  return hasAccess ? <>{children}</> : <>{fallback}</>;
}
