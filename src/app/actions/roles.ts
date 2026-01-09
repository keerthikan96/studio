
'use server';

import { db } from '@/lib/db';
import { Role } from '@/lib/mock-data';
import { ALL_PERMISSIONS, Permission } from '@/lib/permissions';
import { logAuditEvent } from './audit';
import { hasPermission } from '@/lib/permission-utils';

// ========== ROLE ACTIONS ==========

export async function getRolesAction(currentUserId: string): Promise<Role[] | { error: string }> {
    // Check permission
    const canRead = await hasPermission(currentUserId, 'roles.read');
    if (!canRead) {
        return { error: 'You do not have permission to view roles.' } as any;
    }
    
    try {
        const result = await db.query('SELECT * FROM roles ORDER BY name ASC');
        return result.rows;
    } catch (error) {
        console.error('Error fetching roles:', error);
        return [];
    }
}

export async function getRoleAction(id: string): Promise<(Role & { permissions: string[] }) | null> {
    try {
        const roleResult = await db.query('SELECT * FROM roles WHERE id = $1', [id]);
        if (roleResult.rows.length === 0) {
            return null;
        }
        const role = roleResult.rows[0];

        const permissionsResult = await db.query('SELECT permission_id FROM role_permissions WHERE role_id = $1', [id]);
        const permissions = permissionsResult.rows.map(row => row.permission_id);

        return { ...role, permissions };
    } catch (error) {
        console.error(`Error fetching role with id ${id}:`, error);
        return null;
    }
}


export async function createRoleAction(data: { name: string; description?: string; permissions?: string[]; currentUserId: string }): Promise<Role | { error: string }> {
    const { name, description, permissions = [], currentUserId } = data;
    
    // Check permission
    const canCreate = await hasPermission(currentUserId, 'roles.create');
    if (!canCreate) {
        return { error: 'You do not have permission to create roles.' };
    }
    
    const client = await db.connect();
    try {
        await client.query('BEGIN');

        const roleResult = await client.query(
            'INSERT INTO roles (name, description) VALUES ($1, $2) RETURNING *',
            [name, description]
        );
        const newRole = roleResult.rows[0];

        if (permissions.length > 0) {
            for (const permissionId of permissions) {
                await client.query(
                    'INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2)',
                    [newRole.id, permissionId]
                );
            }
        }
        
        await logAuditEvent({
            actorId: currentUserId,
            action: 'role.create',
            resource_type: 'role',
            resource_id: newRole.id,
            details: { name, description, permissions }
        }, client);

        await client.query('COMMIT');
        return newRole;
    } catch (error: any) {
        await client.query('ROLLBACK');
        console.error('Error creating role:', error);
        console.error('Error details:', {
            message: error.message,
            code: error.code,
            detail: error.detail
        });
        if (error.code === '23505') { // unique_violation
            return { error: 'A role with this name already exists.' };
        }
        return { error: `Failed to create role: ${error.message || 'Unknown error'}` };
    } finally {
        client.release();
    }
}

export async function updateRoleAction(id: string, data: { name: string; description?: string; permissions?: string[]; currentUserId: string }): Promise<Role | { error: string }> {
    const { name, description, permissions = [], currentUserId } = data;
    
    // Check permission
    const canUpdate = await hasPermission(currentUserId, 'roles.update');
    if (!canUpdate) {
        return { error: 'You do not have permission to update roles.' };
    }
    
    const client = await db.connect();
    try {
        await client.query('BEGIN');

        const roleResult = await client.query(
            'UPDATE roles SET name = $1, description = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
            [name, description, id]
        );
        if (roleResult.rows.length === 0) {
            throw new Error('Role not found.');
        }

        // Update permissions
        await client.query('DELETE FROM role_permissions WHERE role_id = $1', [id]);
        if (permissions.length > 0) {
            for (const permissionId of permissions) {
                await client.query(
                    'INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2)',
                    [id, permissionId]
                );
            }
        }

        await logAuditEvent({
            actorId: currentUserId,
            action: 'role.update',
            resource_type: 'role',
            resource_id: id,
            details: { name, description, permissions }
        }, client);

        await client.query('COMMIT');
        return roleResult.rows[0];
    } catch (error: any) {
        await client.query('ROLLBACK');
        console.error(`Error updating role with id ${id}:`, error);
        console.error('Error details:', {
            message: error.message,
            code: error.code,
            detail: error.detail,
            stack: error.stack
        });
        if (error.code === '23505') { // unique_violation
            return { error: 'A role with this name already exists.' };
        }
        return { error: `Failed to update role: ${error.message || 'Unknown error'}` };
    } finally {
        client.release();
    }
}

// ========== PERMISSION ACTIONS ==========

export async function getPermissionsAction(): Promise<Permission[]> {
    // For now, we return the hardcoded list. In a real app, this might come from the DB.
    return Promise.resolve(ALL_PERMISSIONS);
}
