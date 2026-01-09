'use server';

import { db } from '@/lib/db';
import { Department, DepartmentMember } from '@/lib/mock-data';
import { logAuditEvent } from './audit';
import { hasPermission } from '@/lib/permission-utils';

// ========== DEPARTMENT ACTIONS ==========

export async function getDepartmentsAction(currentUserId: string): Promise<Department[] | { error: string }> {
    // Check permission
    const canRead = await hasPermission(currentUserId, 'departments.read');
    if (!canRead) {
        return { error: 'You do not have permission to view departments.' } as any;
    }
    
    try {
        const result = await db.query('SELECT * FROM departments ORDER BY name ASC');
        return result.rows;
    } catch (error) {
        console.error('Error fetching departments:', error);
        return [];
    }
}

export async function getDepartmentAction(id: string, currentUserId: string): Promise<Department | { error: string } | null> {
    // Check permission
    const canRead = await hasPermission(currentUserId, 'departments.read');
    if (!canRead) {
        return { error: 'You do not have permission to view departments.' };
    }
    
    try {
        const departmentResult = await db.query('SELECT * FROM departments WHERE id = $1', [id]);
        if (departmentResult.rows.length === 0) {
            return null;
        }
        return departmentResult.rows[0];
    } catch (error) {
        console.error(`Error fetching department with id ${id}:`, error);
        return null;
    }
}

export async function createDepartmentAction(data: { 
    name: string; 
    description?: string; 
    currentUserId: string 
}): Promise<Department | { error: string }> {
    const { name, description, currentUserId } = data;
    
    // Check permission
    const canCreate = await hasPermission(currentUserId, 'departments.create');
    if (!canCreate) {
        return { error: 'You do not have permission to create departments.' };
    }
    
    const client = await db.connect();
    try {
        await client.query('BEGIN');

        const departmentResult = await client.query(
            'INSERT INTO departments (name, description) VALUES ($1, $2) RETURNING *',
            [name, description || null]
        );
        const newDepartment = departmentResult.rows[0];
        
        await logAuditEvent({
            actorId: currentUserId,
            action: 'department.create',
            resource_type: 'department',
            resource_id: newDepartment.id,
            details: { name, description }
        }, client);

        await client.query('COMMIT');
        return newDepartment;
    } catch (error: any) {
        await client.query('ROLLBACK');
        console.error('Error creating department:', error);
        if (error.code === '23505') { // unique_violation
            return { error: 'A department with this name already exists.' };
        }
        return { error: `Failed to create department: ${error.message || 'Unknown error'}` };
    } finally {
        client.release();
    }
}

export async function updateDepartmentAction(id: string, data: { 
    name: string; 
    description?: string; 
    currentUserId: string 
}): Promise<Department | { error: string }> {
    const { name, description, currentUserId } = data;
    
    // Check permission
    const canUpdate = await hasPermission(currentUserId, 'departments.update');
    if (!canUpdate) {
        return { error: 'You do not have permission to update departments.' };
    }
    
    const client = await db.connect();
    try {
        await client.query('BEGIN');

        const departmentResult = await client.query(
            'UPDATE departments SET name = $1, description = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
            [name, description || null, id]
        );
        if (departmentResult.rows.length === 0) {
            throw new Error('Department not found.');
        }

        await logAuditEvent({
            actorId: currentUserId,
            action: 'department.update',
            resource_type: 'department',
            resource_id: id,
            details: { name, description }
        }, client);

        await client.query('COMMIT');
        return departmentResult.rows[0];
    } catch (error: any) {
        await client.query('ROLLBACK');
        console.error(`Error updating department with id ${id}:`, error);
        if (error.code === '23505') { // unique_violation
            return { error: 'A department with this name already exists.' };
        }
        return { error: `Failed to update department: ${error.message || 'Unknown error'}` };
    } finally {
        client.release();
    }
}

export async function deleteDepartmentAction(id: string, currentUserId: string): Promise<{ success: boolean } | { error: string }> {
    // Check permission
    const canDelete = await hasPermission(currentUserId, 'departments.delete');
    if (!canDelete) {
        return { error: 'You do not have permission to delete departments.' };
    }
    
    const client = await db.connect();
    try {
        await client.query('BEGIN');

        // Check if department exists
        const departmentResult = await client.query('SELECT * FROM departments WHERE id = $1', [id]);
        if (departmentResult.rows.length === 0) {
            return { error: 'Department not found.' };
        }
        const department = departmentResult.rows[0];

        // Delete department (cascade will handle department_members)
        await client.query('DELETE FROM departments WHERE id = $1', [id]);

        await logAuditEvent({
            actorId: currentUserId,
            action: 'department.delete',
            resource_type: 'department',
            resource_id: id,
            details: { name: department.name }
        }, client);

        await client.query('COMMIT');
        return { success: true };
    } catch (error: any) {
        await client.query('ROLLBACK');
        console.error(`Error deleting department with id ${id}:`, error);
        return { error: `Failed to delete department: ${error.message || 'Unknown error'}` };
    } finally {
        client.release();
    }
}

// ========== DEPARTMENT MEMBER ACTIONS ==========

export async function getDepartmentMembersAction(
    departmentId: string, 
    currentUserId: string
): Promise<any[] | { error: string }> {
    // Check permission
    const canRead = await hasPermission(currentUserId, 'departments.read');
    if (!canRead) {
        return { error: 'You do not have permission to view department members.' };
    }
    
    try {
        const result = await db.query(`
            SELECT 
                m.id,
                m.name,
                m.email,
                m.job_title,
                m.profile_picture_url,
                m.domain,
                dm.is_primary,
                dm.assigned_at
            FROM department_members dm
            JOIN members m ON dm.member_id = m.id
            WHERE dm.department_id = $1
            ORDER BY dm.is_primary DESC, m.name ASC
        `, [departmentId]);
        return result.rows;
    } catch (error) {
        console.error('Error fetching department members:', error);
        return [];
    }
}

export async function getMemberDepartmentsAction(
    memberId: string, 
    currentUserId: string
): Promise<any[] | { error: string }> {
    // Check permission
    const canRead = await hasPermission(currentUserId, 'departments.read');
    if (!canRead) {
        return { error: 'You do not have permission to view member departments.' };
    }
    
    try {
        const result = await db.query(`
            SELECT 
                d.id,
                d.name,
                d.description,
                dm.is_primary,
                dm.assigned_at
            FROM department_members dm
            JOIN departments d ON dm.department_id = d.id
            WHERE dm.member_id = $1
            ORDER BY dm.is_primary DESC, d.name ASC
        `, [memberId]);
        return result.rows;
    } catch (error) {
        console.error('Error fetching member departments:', error);
        return [];
    }
}

export async function assignMemberToDepartmentAction(data: {
    departmentId: string;
    memberId: string;
    isPrimary?: boolean;
    currentUserId: string;
}): Promise<{ success: boolean } | { error: string }> {
    const { departmentId, memberId, isPrimary = false, currentUserId } = data;
    
    // Check permission
    const canManage = await hasPermission(currentUserId, 'departments.manage_members');
    if (!canManage) {
        return { error: 'You do not have permission to manage department members.' };
    }
    
    const client = await db.connect();
    try {
        await client.query('BEGIN');

        // Check if member is already in department
        const existingResult = await client.query(
            'SELECT * FROM department_members WHERE department_id = $1 AND member_id = $2',
            [departmentId, memberId]
        );
        
        if (existingResult.rows.length > 0) {
            // Update existing assignment
            await client.query(
                'UPDATE department_members SET is_primary = $1 WHERE department_id = $2 AND member_id = $3',
                [isPrimary, departmentId, memberId]
            );
        } else {
            // If setting as primary, unset other primary departments for this member
            if (isPrimary) {
                await client.query(
                    'UPDATE department_members SET is_primary = false WHERE member_id = $1',
                    [memberId]
                );
            }
            
            // Insert new assignment
            await client.query(
                'INSERT INTO department_members (department_id, member_id, is_primary) VALUES ($1, $2, $3)',
                [departmentId, memberId, isPrimary]
            );
        }

        // Get department and member names for audit
        const deptResult = await client.query('SELECT name FROM departments WHERE id = $1', [departmentId]);
        const memberResult = await client.query('SELECT name FROM members WHERE id = $1', [memberId]);

        await logAuditEvent({
            actorId: currentUserId,
            action: 'department.assign_member',
            resource_type: 'department',
            resource_id: departmentId,
            details: { 
                departmentName: deptResult.rows[0]?.name,
                memberName: memberResult.rows[0]?.name,
                memberId,
                isPrimary
            }
        }, client);

        await client.query('COMMIT');
        return { success: true };
    } catch (error: any) {
        await client.query('ROLLBACK');
        console.error('Error assigning member to department:', error);
        return { error: `Failed to assign member: ${error.message || 'Unknown error'}` };
    } finally {
        client.release();
    }
}

export async function removeMemberFromDepartmentAction(data: {
    departmentId: string;
    memberId: string;
    currentUserId: string;
}): Promise<{ success: boolean } | { error: string }> {
    const { departmentId, memberId, currentUserId } = data;
    
    // Check permission
    const canManage = await hasPermission(currentUserId, 'departments.manage_members');
    if (!canManage) {
        return { error: 'You do not have permission to manage department members.' };
    }
    
    const client = await db.connect();
    try {
        await client.query('BEGIN');

        // Get department and member names for audit before deletion
        const deptResult = await client.query('SELECT name FROM departments WHERE id = $1', [departmentId]);
        const memberResult = await client.query('SELECT name FROM members WHERE id = $1', [memberId]);

        // Delete assignment
        const result = await client.query(
            'DELETE FROM department_members WHERE department_id = $1 AND member_id = $2',
            [departmentId, memberId]
        );

        if (result.rowCount === 0) {
            return { error: 'Member is not assigned to this department.' };
        }

        await logAuditEvent({
            actorId: currentUserId,
            action: 'department.remove_member',
            resource_type: 'department',
            resource_id: departmentId,
            details: { 
                departmentName: deptResult.rows[0]?.name,
                memberName: memberResult.rows[0]?.name,
                memberId
            }
        }, client);

        await client.query('COMMIT');
        return { success: true };
    } catch (error: any) {
        await client.query('ROLLBACK');
        console.error('Error removing member from department:', error);
        return { error: `Failed to remove member: ${error.message || 'Unknown error'}` };
    } finally {
        client.release();
    }
}

export async function setPrimaryDepartmentAction(data: {
    departmentId: string;
    memberId: string;
    currentUserId: string;
}): Promise<{ success: boolean } | { error: string }> {
    const { departmentId, memberId, currentUserId } = data;
    
    // Check permission
    const canManage = await hasPermission(currentUserId, 'departments.manage_members');
    if (!canManage) {
        return { error: 'You do not have permission to manage department members.' };
    }
    
    const client = await db.connect();
    try {
        await client.query('BEGIN');

        // Verify member is in this department
        const existingResult = await client.query(
            'SELECT * FROM department_members WHERE department_id = $1 AND member_id = $2',
            [departmentId, memberId]
        );
        
        if (existingResult.rows.length === 0) {
            return { error: 'Member is not assigned to this department.' };
        }

        // Unset all primary departments for this member
        await client.query(
            'UPDATE department_members SET is_primary = false WHERE member_id = $1',
            [memberId]
        );

        // Set this department as primary
        await client.query(
            'UPDATE department_members SET is_primary = true WHERE department_id = $1 AND member_id = $2',
            [departmentId, memberId]
        );

        // Get department and member names for audit
        const deptResult = await client.query('SELECT name FROM departments WHERE id = $1', [departmentId]);
        const memberResult = await client.query('SELECT name FROM members WHERE id = $1', [memberId]);

        await logAuditEvent({
            actorId: currentUserId,
            action: 'department.set_primary',
            resource_type: 'department',
            resource_id: departmentId,
            details: { 
                departmentName: deptResult.rows[0]?.name,
                memberName: memberResult.rows[0]?.name,
                memberId
            }
        }, client);

        await client.query('COMMIT');
        return { success: true };
    } catch (error: any) {
        await client.query('ROLLBACK');
        console.error('Error setting primary department:', error);
        return { error: `Failed to set primary department: ${error.message || 'Unknown error'}` };
    } finally {
        client.release();
    }
}
