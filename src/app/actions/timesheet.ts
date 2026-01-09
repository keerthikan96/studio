'use server';

import { db, setupDatabase } from '@/lib/db';
import { Project, ProjectMilestone, TimeEntry, TimesheetWeek, MemberProject, PayType } from '@/lib/mock-data';
import { revalidatePath } from 'next/cache';
import { logAuditEvent } from './audit';
import { PoolClient } from 'pg';
import { hasPermission } from '@/lib/permission-utils';

async function logTimesheetAudit(client: PoolClient, params: {
    entityType: string;
    entityId: string;
    action: string;
    performedBy: string;
    details?: any;
}) {
    await client.query(
        `INSERT INTO timesheet_audit (entity_type, entity_id, action, performed_by, details)
         VALUES ($1, $2, $3, $4, $5)`,
        [params.entityType, params.entityId, params.action, params.performedBy, JSON.stringify(params.details || {})]
    );
}

// ========== HELPER FUNCTIONS ==========

function getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday as week start
    return new Date(d.setDate(diff));
}

function getWeekEnd(weekStart: Date): Date {
    const end = new Date(weekStart);
    end.setDate(end.getDate() + 6); // Sunday
    return end;
}

function formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
}

// ========== PROJECT ACTIONS ==========

export async function getProjectsAction(currentUserId: string): Promise<Project[] | { error: string }> {
    await setupDatabase();
    
    const canManage = await hasPermission(currentUserId, 'timesheet.manage_projects');
    
    try {
        let query = `
            SELECT DISTINCT p.* FROM projects p
            WHERE p.status = 'ACTIVE'
        `;
        
        // If user can't manage projects, only show assigned projects
        if (!canManage) {
            query = `
                SELECT DISTINCT p.* FROM projects p
                INNER JOIN member_projects mp ON p.id = mp.project_id
                WHERE p.status = 'ACTIVE' AND mp.user_id = $1
            `;
            const result = await db.query(query, [currentUserId]);
            return result.rows;
        }
        
        const result = await db.query(query);
        return result.rows;
    } catch (error) {
        console.error('Error fetching projects:', error);
        return { error: 'Failed to fetch projects' };
    }
}

export async function getAllProjectsAction(currentUserId: string): Promise<Project[] | { error: string }> {
    await setupDatabase();
    
    const canManage = await hasPermission(currentUserId, 'timesheet.manage_projects');
    if (!canManage) {
        return { error: 'You do not have permission to manage projects.' };
    }
    
    try {
        const result = await db.query(`
            SELECT p.*, 
                   (SELECT COUNT(*) FROM project_milestones WHERE project_id = p.id) as milestone_count
            FROM projects p
            ORDER BY p.created_at DESC
        `);
        return result.rows;
    } catch (error) {
        console.error('Error fetching all projects:', error);
        return { error: 'Failed to fetch projects' };
    }
}

export async function createProjectAction(
    currentUserId: string,
    data: { name: string; code?: string; description?: string }
): Promise<Project | { error: string }> {
    await setupDatabase();
    
    const canManage = await hasPermission(currentUserId, 'timesheet.manage_projects');
    if (!canManage) {
        return { error: 'You do not have permission to create projects.' };
    }
    
    const client = await db.connect();
    try {
        await client.query('BEGIN');
        
        const result = await client.query(
            `INSERT INTO projects (name, code, description, status, created_by)
             VALUES ($1, $2, $3, 'ACTIVE', $4) RETURNING *`,
            [data.name, data.code, data.description, currentUserId]
        );
        
        await logTimesheetAudit(client, {
            entityType: 'project',
            entityId: result.rows[0].id,
            action: 'CREATE',
            performedBy: currentUserId,
            details: { name: data.name }
        });
        
        await client.query('COMMIT');
        revalidatePath('/admin/timesheet/projects');
        return result.rows[0];
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error creating project:', error);
        return { error: 'Failed to create project' };
    } finally {
        client.release();
    }
}

export async function updateProjectAction(
    currentUserId: string,
    projectId: string,
    data: { name?: string; code?: string; description?: string; status?: 'ACTIVE' | 'ARCHIVED' }
): Promise<Project | { error: string }> {
    await setupDatabase();
    
    const canManage = await hasPermission(currentUserId, 'timesheet.manage_projects');
    if (!canManage) {
        return { error: 'You do not have permission to update projects.' };
    }
    
    const client = await db.connect();
    try {
        await client.query('BEGIN');
        
        const updates: string[] = [];
        const values: any[] = [];
        let valueIndex = 1;
        
        if (data.name !== undefined) {
            updates.push(`name = $${valueIndex++}`);
            values.push(data.name);
        }
        if (data.code !== undefined) {
            updates.push(`code = $${valueIndex++}`);
            values.push(data.code);
        }
        if (data.description !== undefined) {
            updates.push(`description = $${valueIndex++}`);
            values.push(data.description);
        }
        if (data.status !== undefined) {
            updates.push(`status = $${valueIndex++}`);
            values.push(data.status);
        }
        
        updates.push(`updated_at = NOW()`);
        values.push(projectId);
        
        const result = await client.query(
            `UPDATE projects SET ${updates.join(', ')} WHERE id = $${valueIndex} RETURNING *`,
            values
        );
        
        await logTimesheetAudit(client, {
            entityType: 'project',
            entityId: projectId,
            action: 'UPDATE',
            performedBy: currentUserId,
            details: data
        });
        
        await client.query('COMMIT');
        revalidatePath('/admin/timesheet/projects');
        return result.rows[0];
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error updating project:', error);
        return { error: 'Failed to update project' };
    } finally {
        client.release();
    }
}

// ========== MILESTONE ACTIONS ==========

export async function getMilestonesAction(projectId: string): Promise<ProjectMilestone[]> {
    await setupDatabase();
    
    try {
        const result = await db.query(
            `SELECT * FROM project_milestones WHERE project_id = $1 ORDER BY due_date ASC`,
            [projectId]
        );
        return result.rows;
    } catch (error) {
        console.error('Error fetching milestones:', error);
        return [];
    }
}

export async function createMilestoneAction(
    currentUserId: string,
    data: { project_id: string; name: string; due_date?: string; is_billable?: boolean }
): Promise<ProjectMilestone | { error: string }> {
    await setupDatabase();
    
    const canManage = await hasPermission(currentUserId, 'timesheet.manage_milestones');
    if (!canManage) {
        return { error: 'You do not have permission to create milestones.' };
    }
    
    const client = await db.connect();
    try {
        await client.query('BEGIN');
        
        const result = await client.query(
            `INSERT INTO project_milestones (project_id, name, due_date, is_billable, created_by)
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [data.project_id, data.name, data.due_date, data.is_billable ?? true, currentUserId]
        );
        
        await logTimesheetAudit(client, {
            entityType: 'milestone',
            entityId: result.rows[0].id,
            action: 'CREATE',
            performedBy: currentUserId,
            details: { project_id: data.project_id, name: data.name }
        });
        
        await client.query('COMMIT');
        revalidatePath('/admin/timesheet/projects');
        return result.rows[0];
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error creating milestone:', error);
        return { error: 'Failed to create milestone' };
    } finally {
        client.release();
    }
}

export async function deleteMilestoneAction(
    currentUserId: string,
    milestoneId: string
): Promise<{ success: boolean } | { error: string }> {
    await setupDatabase();
    
    const canManage = await hasPermission(currentUserId, 'timesheet.manage_milestones');
    if (!canManage) {
        return { error: 'You do not have permission to delete milestones.' };
    }
    
    const client = await db.connect();
    try {
        await client.query('BEGIN');
        
        await logTimesheetAudit(client, {
            entityType: 'milestone',
            entityId: milestoneId,
            action: 'DELETE',
            performedBy: currentUserId
        });
        
        await client.query('DELETE FROM project_milestones WHERE id = $1', [milestoneId]);
        
        await client.query('COMMIT');
        revalidatePath('/admin/timesheet/projects');
        return { success: true };
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error deleting milestone:', error);
        return { error: 'Failed to delete milestone' };
    } finally {
        client.release();
    }
}

// ========== MEMBER PROJECT ASSIGNMENT ==========

export async function assignProjectToMemberAction(
    currentUserId: string,
    projectId: string,
    userId: string,
    role?: string
): Promise<{ success: boolean } | { error: string }> {
    await setupDatabase();
    
    const canManage = await hasPermission(currentUserId, 'timesheet.manage_projects');
    if (!canManage) {
        return { error: 'You do not have permission to assign projects.' };
    }
    
    const client = await db.connect();
    try {
        await client.query('BEGIN');
        
        await client.query(
            `INSERT INTO member_projects (project_id, user_id, role)
             VALUES ($1, $2, $3)
             ON CONFLICT (project_id, user_id) DO UPDATE SET role = $3`,
            [projectId, userId, role]
        );
        
        await logTimesheetAudit(client, {
            entityType: 'member_project',
            entityId: projectId,
            action: 'ASSIGN',
            performedBy: currentUserId,
            details: { user_id: userId, role }
        });
        
        await client.query('COMMIT');
        revalidatePath('/admin/timesheet/projects');
        return { success: true };
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error assigning project:', error);
        return { error: 'Failed to assign project' };
    } finally {
        client.release();
    }
}

export async function removeProjectFromMemberAction(
    currentUserId: string,
    projectId: string,
    userId: string
): Promise<{ success: boolean } | { error: string }> {
    await setupDatabase();
    
    const canManage = await hasPermission(currentUserId, 'timesheet.manage_projects');
    if (!canManage) {
        return { error: 'You do not have permission to remove project assignments.' };
    }
    
    const client = await db.connect();
    try {
        await client.query('BEGIN');
        
        await client.query(
            'DELETE FROM member_projects WHERE project_id = $1 AND user_id = $2',
            [projectId, userId]
        );
        
        await logTimesheetAudit(client, {
            entityType: 'member_project',
            entityId: projectId,
            action: 'UNASSIGN',
            performedBy: currentUserId,
            details: { user_id: userId }
        });
        
        await client.query('COMMIT');
        revalidatePath('/admin/timesheet/projects');
        return { success: true };
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error removing project assignment:', error);
        return { error: 'Failed to remove assignment' };
    } finally {
        client.release();
    }
}

export async function getProjectMembersAction(projectId: string): Promise<MemberProject[]> {
    await setupDatabase();
    
    try {
        const result = await db.query(
            `SELECT mp.*, m.name as user_name, m.email
             FROM member_projects mp
             JOIN members m ON mp.user_id = m.id
             WHERE mp.project_id = $1
             ORDER BY m.name ASC`,
            [projectId]
        );
        return result.rows;
    } catch (error) {
        console.error('Error fetching project members:', error);
        return [];
    }
}

// ========== TIME ENTRY ACTIONS ==========

export async function getWeekEntriesAction(
    currentUserId: string,
    weekStartDate: string
): Promise<{ week: TimesheetWeek; entries: TimeEntry[] } | { error: string }> {
    await setupDatabase();
    
    try {
        // Get or create timesheet week
        let weekResult = await db.query(
            'SELECT * FROM timesheet_weeks WHERE user_id = $1 AND week_start_date = $2',
            [currentUserId, weekStartDate]
        );
        
        if (weekResult.rows.length === 0) {
            const weekStart = new Date(weekStartDate);
            const weekEnd = getWeekEnd(weekStart);
            
            weekResult = await db.query(
                `INSERT INTO timesheet_weeks (user_id, week_start_date, week_end_date, status, total_hours)
                 VALUES ($1, $2, $3, 'DRAFT', 0) RETURNING *`,
                [currentUserId, weekStartDate, formatDate(weekEnd)]
            );
        }
        
        const week = weekResult.rows[0];
        
        // Get entries for the week
        const entriesResult = await db.query(
            `SELECT te.*, p.name as project_name, pm.name as milestone_name
             FROM time_entries te
             LEFT JOIN projects p ON te.project_id = p.id
             LEFT JOIN project_milestones pm ON te.milestone_id = pm.id
             WHERE te.user_id = $1 AND te.timesheet_week_id = $2
             ORDER BY te.date ASC, te.created_at ASC`,
            [currentUserId, week.id]
        );
        
        return { week, entries: entriesResult.rows };
    } catch (error) {
        console.error('Error fetching week entries:', error);
        return { error: 'Failed to fetch timesheet' };
    }
}

export async function createTimeEntryAction(
    currentUserId: string,
    data: {
        date: string;
        project_id: string;
        milestone_id?: string;
        hours: number;
        pay_type: PayType;
        description?: string;
        is_billable?: boolean;
    }
): Promise<TimeEntry | { error: string }> {
    await setupDatabase();
    
    const canCreate = await hasPermission(currentUserId, 'timesheet.create_entry');
    if (!canCreate) {
        return { error: 'You do not have permission to create time entries.' };
    }
    
    // Validation
    if (data.hours <= 0 || data.hours > 24) {
        return { error: 'Hours must be between 0.01 and 24.' };
    }
    
    const client = await db.connect();
    try {
        await client.query('BEGIN');
        
        // Calculate week start for the entry date
        const entryDate = new Date(data.date);
        const weekStart = getWeekStart(entryDate);
        const weekEnd = getWeekEnd(weekStart);
        const weekStartStr = formatDate(weekStart);
        const weekEndStr = formatDate(weekEnd);
        
        // Get or create timesheet week
        let weekResult = await client.query(
            'SELECT * FROM timesheet_weeks WHERE user_id = $1 AND week_start_date = $2 FOR UPDATE',
            [currentUserId, weekStartStr]
        );
        
        if (weekResult.rows.length === 0) {
            weekResult = await client.query(
                `INSERT INTO timesheet_weeks (user_id, week_start_date, week_end_date, status, total_hours)
                 VALUES ($1, $2, $3, 'DRAFT', 0) RETURNING *`,
                [currentUserId, weekStartStr, weekEndStr]
            );
        }
        
        const week = weekResult.rows[0];
        
        // Check if week is locked
        if (week.status === 'APPROVED' || week.status === 'LOCKED') {
            await client.query('ROLLBACK');
            return { error: 'Cannot add entries to approved or locked weeks.' };
        }
        
        // Check daily hours limit
        const dailyTotal = await client.query(
            `SELECT COALESCE(SUM(hours), 0) as total 
             FROM time_entries 
             WHERE user_id = $1 AND date = $2`,
            [currentUserId, data.date]
        );
        
        if (parseFloat(dailyTotal.rows[0].total) + data.hours > 24) {
            await client.query('ROLLBACK');
            return { error: 'Daily hours cannot exceed 24 hours.' };
        }
        
        // Insert time entry
        const entryResult = await client.query(
            `INSERT INTO time_entries (
                timesheet_week_id, user_id, date, project_id, milestone_id, 
                hours, pay_type, description, is_billable, created_by
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
            [
                week.id, currentUserId, data.date, data.project_id, data.milestone_id,
                data.hours, data.pay_type, data.description, data.is_billable ?? true, currentUserId
            ]
        );
        
        // Update week total
        await client.query(
            `UPDATE timesheet_weeks 
             SET total_hours = total_hours + $1, updated_at = NOW()
             WHERE id = $2`,
            [data.hours, week.id]
        );
        
        await logTimesheetAudit(client, {
            entityType: 'time_entry',
            entityId: entryResult.rows[0].id,
            action: 'CREATE',
            performedBy: currentUserId,
            details: { date: data.date, hours: data.hours, project_id: data.project_id }
        });
        
        await client.query('COMMIT');
        revalidatePath('/dashboard/timesheet');
        return entryResult.rows[0];
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error creating time entry:', error);
        return { error: 'Failed to create time entry' };
    } finally {
        client.release();
    }
}

export async function updateTimeEntryAction(
    currentUserId: string,
    entryId: string,
    data: {
        date?: string;
        project_id?: string;
        milestone_id?: string;
        hours?: number;
        pay_type?: PayType;
        description?: string;
        is_billable?: boolean;
    }
): Promise<TimeEntry | { error: string }> {
    await setupDatabase();
    
    const client = await db.connect();
    try {
        await client.query('BEGIN');
        
        // Get existing entry
        const existingResult = await client.query(
            `SELECT te.*, tw.status as week_status
             FROM time_entries te
             JOIN timesheet_weeks tw ON te.timesheet_week_id = tw.id
             WHERE te.id = $1 AND te.user_id = $2 FOR UPDATE`,
            [entryId, currentUserId]
        );
        
        if (existingResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return { error: 'Entry not found or access denied.' };
        }
        
        const existing = existingResult.rows[0];
        
        // Check if week is locked
        if (existing.week_status === 'APPROVED' || existing.week_status === 'LOCKED') {
            const canOverride = await hasPermission(currentUserId, 'timesheet.approve');
            if (!canOverride) {
                await client.query('ROLLBACK');
                return { error: 'Cannot edit entries in approved or locked weeks.' };
            }
        }
        
        // Validation
        if (data.hours !== undefined && (data.hours <= 0 || data.hours > 24)) {
            await client.query('ROLLBACK');
            return { error: 'Hours must be between 0.01 and 24.' };
        }
        
        // Build update query
        const updates: string[] = [];
        const values: any[] = [];
        let valueIndex = 1;
        
        if (data.date !== undefined) {
            updates.push(`date = $${valueIndex++}`);
            values.push(data.date);
        }
        if (data.project_id !== undefined) {
            updates.push(`project_id = $${valueIndex++}`);
            values.push(data.project_id);
        }
        if (data.milestone_id !== undefined) {
            updates.push(`milestone_id = $${valueIndex++}`);
            values.push(data.milestone_id);
        }
        if (data.hours !== undefined) {
            updates.push(`hours = $${valueIndex++}`);
            values.push(data.hours);
        }
        if (data.pay_type !== undefined) {
            updates.push(`pay_type = $${valueIndex++}`);
            values.push(data.pay_type);
        }
        if (data.description !== undefined) {
            updates.push(`description = $${valueIndex++}`);
            values.push(data.description);
        }
        if (data.is_billable !== undefined) {
            updates.push(`is_billable = $${valueIndex++}`);
            values.push(data.is_billable);
        }
        
        updates.push(`updated_at = NOW()`);
        values.push(entryId);
        
        const result = await client.query(
            `UPDATE time_entries SET ${updates.join(', ')} WHERE id = $${valueIndex} RETURNING *`,
            values
        );
        
        // Update week total if hours changed
        if (data.hours !== undefined) {
            const hoursDiff = data.hours - parseFloat(existing.hours);
            await client.query(
                `UPDATE timesheet_weeks 
                 SET total_hours = total_hours + $1, updated_at = NOW()
                 WHERE id = $2`,
                [hoursDiff, existing.timesheet_week_id]
            );
        }
        
        await logTimesheetAudit(client, {
            entityType: 'time_entry',
            entityId: entryId,
            action: 'UPDATE',
            performedBy: currentUserId,
            details: data
        });
        
        await client.query('COMMIT');
        revalidatePath('/dashboard/timesheet');
        return result.rows[0];
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error updating time entry:', error);
        return { error: 'Failed to update time entry' };
    } finally {
        client.release();
    }
}

export async function deleteTimeEntryAction(
    currentUserId: string,
    entryId: string
): Promise<{ success: boolean } | { error: string }> {
    await setupDatabase();
    
    const client = await db.connect();
    try {
        await client.query('BEGIN');
        
        // Get existing entry
        const existingResult = await client.query(
            `SELECT te.*, tw.status as week_status
             FROM time_entries te
             JOIN timesheet_weeks tw ON te.timesheet_week_id = tw.id
             WHERE te.id = $1 AND te.user_id = $2 FOR UPDATE`,
            [entryId, currentUserId]
        );
        
        if (existingResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return { error: 'Entry not found or access denied.' };
        }
        
        const existing = existingResult.rows[0];
        
        // Check if week is locked
        if (existing.week_status === 'APPROVED' || existing.week_status === 'LOCKED') {
            const canOverride = await hasPermission(currentUserId, 'timesheet.approve');
            if (!canOverride) {
                await client.query('ROLLBACK');
                return { error: 'Cannot delete entries from approved or locked weeks.' };
            }
        }
        
        // Update week total
        await client.query(
            `UPDATE timesheet_weeks 
             SET total_hours = total_hours - $1, updated_at = NOW()
             WHERE id = $2`,
            [existing.hours, existing.timesheet_week_id]
        );
        
        await logTimesheetAudit(client, {
            entityType: 'time_entry',
            entityId: entryId,
            action: 'DELETE',
            performedBy: currentUserId,
            details: { hours: existing.hours, date: existing.date }
        });
        
        await client.query('DELETE FROM time_entries WHERE id = $1', [entryId]);
        
        await client.query('COMMIT');
        revalidatePath('/dashboard/timesheet');
        return { success: true };
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error deleting time entry:', error);
        return { error: 'Failed to delete time entry' };
    } finally {
        client.release();
    }
}

// ========== WEEK SUBMISSION AND APPROVAL ==========

export async function submitWeekAction(
    currentUserId: string,
    weekStartDate: string
): Promise<{ success: boolean } | { error: string }> {
    await setupDatabase();
    
    const client = await db.connect();
    try {
        await client.query('BEGIN');
        
        const weekResult = await client.query(
            'SELECT * FROM timesheet_weeks WHERE user_id = $1 AND week_start_date = $2 FOR UPDATE',
            [currentUserId, weekStartDate]
        );
        
        if (weekResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return { error: 'Week not found.' };
        }
        
        const week = weekResult.rows[0];
        
        if (week.status !== 'DRAFT' && week.status !== 'REJECTED') {
            await client.query('ROLLBACK');
            return { error: 'Week has already been submitted.' };
        }
        
        // Validate minimum hours (default 40)
        const minimumHours = 40; // TODO: Make this configurable per user
        
        if (parseFloat(week.total_hours) < minimumHours) {
            await client.query('ROLLBACK');
            return { 
                error: `Week total ${week.total_hours}h is less than required ${minimumHours}h. Please add ${(minimumHours - parseFloat(week.total_hours)).toFixed(2)}h.` 
            };
        }
        
        // Update week status
        await client.query(
            `UPDATE timesheet_weeks 
             SET status = 'SUBMITTED', submitted_at = NOW(), submitted_by = $1, updated_at = NOW()
             WHERE id = $2`,
            [currentUserId, week.id]
        );
        
        await logTimesheetAudit(client, {
            entityType: 'timesheet_week',
            entityId: week.id,
            action: 'SUBMIT',
            performedBy: currentUserId,
            details: { total_hours: week.total_hours, week_start_date: weekStartDate }
        });
        
        await client.query('COMMIT');
        revalidatePath('/dashboard/timesheet');
        revalidatePath('/admin/timesheet');
        
        // TODO: Send notification to manager
        
        return { success: true };
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error submitting week:', error);
        return { error: 'Failed to submit timesheet' };
    } finally {
        client.release();
    }
}

export async function approveWeekAction(
    currentUserId: string,
    weekId: string,
    notes?: string
): Promise<{ success: boolean } | { error: string }> {
    await setupDatabase();
    
    const canApprove = await hasPermission(currentUserId, 'timesheet.approve');
    if (!canApprove) {
        return { error: 'You do not have permission to approve timesheets.' };
    }
    
    const client = await db.connect();
    try {
        await client.query('BEGIN');
        
        const weekResult = await client.query(
            'SELECT * FROM timesheet_weeks WHERE id = $1 FOR UPDATE',
            [weekId]
        );
        
        if (weekResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return { error: 'Week not found.' };
        }
        
        const week = weekResult.rows[0];
        
        if (week.status !== 'SUBMITTED') {
            await client.query('ROLLBACK');
            return { error: 'Week must be submitted before approval.' };
        }
        
        await client.query(
            `UPDATE timesheet_weeks 
             SET status = 'APPROVED', approved_at = NOW(), approved_by = $1, notes = $2, updated_at = NOW()
             WHERE id = $3`,
            [currentUserId, notes, weekId]
        );
        
        await logTimesheetAudit(client, {
            entityType: 'timesheet_week',
            entityId: weekId,
            action: 'APPROVE',
            performedBy: currentUserId,
            details: { notes }
        });
        
        await client.query('COMMIT');
        revalidatePath('/admin/timesheet');
        
        // TODO: Send notification to user
        
        return { success: true };
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error approving week:', error);
        return { error: 'Failed to approve timesheet' };
    } finally {
        client.release();
    }
}

export async function rejectWeekAction(
    currentUserId: string,
    weekId: string,
    notes: string
): Promise<{ success: boolean } | { error: string }> {
    await setupDatabase();
    
    const canReject = await hasPermission(currentUserId, 'timesheet.reject');
    if (!canReject) {
        return { error: 'You do not have permission to reject timesheets.' };
    }
    
    if (!notes || notes.trim() === '') {
        return { error: 'Rejection reason is required.' };
    }
    
    const client = await db.connect();
    try {
        await client.query('BEGIN');
        
        const weekResult = await client.query(
            'SELECT * FROM timesheet_weeks WHERE id = $1 FOR UPDATE',
            [weekId]
        );
        
        if (weekResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return { error: 'Week not found.' };
        }
        
        const week = weekResult.rows[0];
        
        if (week.status !== 'SUBMITTED') {
            await client.query('ROLLBACK');
            return { error: 'Week must be submitted before rejection.' };
        }
        
        await client.query(
            `UPDATE timesheet_weeks 
             SET status = 'REJECTED', notes = $1, updated_at = NOW()
             WHERE id = $2`,
            [notes, weekId]
        );
        
        await logTimesheetAudit(client, {
            entityType: 'timesheet_week',
            entityId: weekId,
            action: 'REJECT',
            performedBy: currentUserId,
            details: { notes }
        });
        
        await client.query('COMMIT');
        revalidatePath('/admin/timesheet');
        
        // TODO: Send notification to user
        
        return { success: true };
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error rejecting week:', error);
        return { error: 'Failed to reject timesheet' };
    } finally {
        client.release();
    }
}

// ========== ADMIN ACTIONS ==========

export async function getAllTimesheetsAction(
    currentUserId: string,
    filters?: {
        status?: string;
        startDate?: string;
        endDate?: string;
        userId?: string;
    }
): Promise<TimesheetWeek[] | { error: string }> {
    await setupDatabase();
    
    const canReadAll = await hasPermission(currentUserId, 'timesheet.read_all');
    if (!canReadAll) {
        return { error: 'You do not have permission to view all timesheets.' };
    }
    
    try {
        let query = `
            SELECT tw.*, m.name as user_name, m.email as user_email,
                   approver.name as approved_by_name
            FROM timesheet_weeks tw
            JOIN members m ON tw.user_id = m.id
            LEFT JOIN members approver ON tw.approved_by = approver.id
            WHERE 1=1
        `;
        const values: any[] = [];
        let valueIndex = 1;
        
        if (filters?.status) {
            query += ` AND tw.status = $${valueIndex++}`;
            values.push(filters.status);
        }
        if (filters?.startDate) {
            query += ` AND tw.week_start_date >= $${valueIndex++}`;
            values.push(filters.startDate);
        }
        if (filters?.endDate) {
            query += ` AND tw.week_start_date <= $${valueIndex++}`;
            values.push(filters.endDate);
        }
        if (filters?.userId) {
            query += ` AND tw.user_id = $${valueIndex++}`;
            values.push(filters.userId);
        }
        
        query += ' ORDER BY tw.week_start_date DESC, m.name ASC';
        
        const result = await db.query(query, values);
        return result.rows;
    } catch (error) {
        console.error('Error fetching all timesheets:', error);
        return { error: 'Failed to fetch timesheets' };
    }
}
