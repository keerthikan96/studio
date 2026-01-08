'use server';

import { db } from '@/lib/db';

/**
 * Permission Utility Functions
 * Server-side functions to check user permissions based on their assigned role
 */

interface Permission {
  id: string;
  description: string;
  resource: string;
}

/**
 * Get all permissions for a user based on their role
 * @param userId - The UUID of the user
 * @returns Array of permission IDs that the user has
 */
export async function getUserPermissions(userId: string): Promise<string[]> {
  try {
    const result = await db.query(
      `
      SELECT DISTINCT p.id as permission_id
      FROM permissions p
      INNER JOIN role_permissions rp ON p.id = rp.permission_id
      INNER JOIN role_members rm ON rp.role_id = rm.role_id
      WHERE rm.member_id = $1
      ORDER BY p.id
      `,
      [userId]
    );

    return result.rows.map((row: any) => row.permission_id);
  } catch (error) {
    console.error('Error fetching user permissions:', error);
    return [];
  }
}

/**
 * Check if a user has a specific permission
 * @param userId - The UUID of the user
 * @param permissionId - The permission ID to check (e.g., 'members.create')
 * @returns true if user has the permission, false otherwise
 */
export async function hasPermission(
  userId: string,
  permissionId: string
): Promise<boolean> {
  try {
    const result = await db.query(
      `
      SELECT EXISTS (
        SELECT 1
        FROM permissions p
        INNER JOIN role_permissions rp ON p.id = rp.permission_id
        INNER JOIN role_members rm ON rp.role_id = rm.role_id
        WHERE rm.member_id = $1 AND p.id = $2
      ) as has_permission
      `,
      [userId, permissionId]
    );

    return result.rows[0]?.has_permission || false;
  } catch (error) {
    console.error('Error checking permission:', error);
    return false;
  }
}

/**
 * Check if a user has ANY of the specified permissions
 * @param userId - The UUID of the user
 * @param permissionIds - Array of permission IDs to check
 * @returns true if user has at least one of the permissions, false otherwise
 */
export async function hasAnyPermission(
  userId: string,
  permissionIds: string[]
): Promise<boolean> {
  if (!permissionIds || permissionIds.length === 0) {
    return false;
  }

  try {
    const result = await db.query(
      `
      SELECT EXISTS (
        SELECT 1
        FROM permissions p
        INNER JOIN role_permissions rp ON p.id = rp.permission_id
        INNER JOIN role_members rm ON rp.role_id = rm.role_id
        WHERE rm.member_id = $1 AND p.id = ANY($2::text[])
      ) as has_any_permission
      `,
      [userId, permissionIds]
    );

    return result.rows[0]?.has_any_permission || false;
  } catch (error) {
    console.error('Error checking any permission:', error);
    return false;
  }
}

/**
 * Check if a user has ALL of the specified permissions
 * @param userId - The UUID of the user
 * @param permissionIds - Array of permission IDs to check
 * @returns true if user has all of the permissions, false otherwise
 */
export async function hasAllPermissions(
  userId: string,
  permissionIds: string[]
): Promise<boolean> {
  if (!permissionIds || permissionIds.length === 0) {
    return true; // Empty array means no requirements
  }

  try {
    const result = await db.query(
      `
      SELECT COUNT(DISTINCT p.id) as permission_count
      FROM permissions p
      INNER JOIN role_permissions rp ON p.id = rp.permission_id
      INNER JOIN role_members rm ON rp.role_id = rm.role_id
      WHERE rm.member_id = $1 AND p.id = ANY($2::text[])
      `,
      [userId, permissionIds]
    );

    const count = parseInt(result.rows[0]?.permission_count || '0');
    return count === permissionIds.length;
  } catch (error) {
    console.error('Error checking all permissions:', error);
    return false;
  }
}

/**
 * Get detailed permission information for a user
 * @param userId - The UUID of the user
 * @returns Array of permission objects with id, description, and resource
 */
export async function getUserPermissionDetails(
  userId: string
): Promise<Permission[]> {
  try {
    const result = await db.query(
      `
      SELECT DISTINCT p.id, p.description, p.resource
      FROM permissions p
      INNER JOIN role_permissions rp ON p.id = rp.permission_id
      INNER JOIN role_members rm ON rp.role_id = rm.role_id
      WHERE rm.member_id = $1
      ORDER BY p.resource, p.id
      `,
      [userId]
    );

    return result.rows;
  } catch (error) {
    console.error('Error fetching user permission details:', error);
    return [];
  }
}

/**
 * Helper function to get current user ID from session
 * This should be implemented based on your auth system
 */
export async function getCurrentUserId(): Promise<string | null> {
  // TODO: Implement based on your authentication system
  // For now, this returns null - you'll need to integrate with your session management
  
  // Example implementation if using sessionStorage:
  // const session = await getSession();
  // return session?.user?.id || null;
  
  return null;
}

/**
 * Require permission - throws error if user doesn't have permission
 * Use this at the start of server actions to enforce permission checks
 * @param userId - The UUID of the user
 * @param permissionId - The permission ID required
 * @throws Error if user doesn't have the permission
 */
export async function requirePermission(
  userId: string,
  permissionId: string
): Promise<void> {
  const permitted = await hasPermission(userId, permissionId);
  
  if (!permitted) {
    throw new Error(`Insufficient permissions. Required: ${permissionId}`);
  }
}

/**
 * Require any permission - throws error if user doesn't have at least one
 * @param userId - The UUID of the user
 * @param permissionIds - Array of permission IDs
 * @throws Error if user doesn't have any of the permissions
 */
export async function requireAnyPermission(
  userId: string,
  permissionIds: string[]
): Promise<void> {
  const permitted = await hasAnyPermission(userId, permissionIds);
  
  if (!permitted) {
    throw new Error(`Insufficient permissions. Required one of: ${permissionIds.join(', ')}`);
  }
}
