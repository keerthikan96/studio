
'use server';

import { db, setupDatabase } from '@/lib/db';
import { LeaveCategory, LeaveEntitlement, LeaveRequest } from '@/lib/mock-data';
import { revalidatePath } from 'next/cache';

// ========== CATEGORY ACTIONS ==========

export async function getLeaveCategoriesAction(): Promise<LeaveCategory[]> {
    await setupDatabase();
    try {
        const result = await db.query('SELECT * FROM leave_categories ORDER BY name ASC');
        return result.rows;
    } catch (error) {
        console.error('Error fetching leave categories:', error);
        return [];
    }
}

// ========== ENTITLEMENT ACTIONS ==========

export async function getMemberEntitlementsAction(memberId: string, year: number): Promise<LeaveEntitlement[]> {
    await setupDatabase();
    try {
        const result = await db.query(`
            SELECT le.*, lc.name as leave_category_name
            FROM leave_entitlements le
            JOIN leave_categories lc ON le.category_id = lc.id
            WHERE le.member_id = $1 AND le.year = $2
        `, [memberId, year]);
        return result.rows;
    } catch (error) {
        console.error(`Error fetching entitlements for member ${memberId}:`, error);
        return [];
    }
}

// ========== REQUEST ACTIONS ==========

export async function getLeaveRequestsAction(): Promise<(LeaveRequest & { member_name: string })[]> {
    await setupDatabase();
    try {
        const result = await db.query(`
            SELECT lr.*, m.name as member_name, lc.name as leave_category_name
            FROM leave_requests lr
            JOIN members m ON lr.member_id = m.id
            JOIN leave_categories lc ON lr.category_id = lc.id
            ORDER BY lr.created_at DESC
        `);
        return result.rows;
    } catch (error) {
        console.error('Error fetching leave requests:', error);
        return [];
    }
}

export async function getMemberLeaveRequestsAction(memberId: string): Promise<LeaveRequest[]> {
     await setupDatabase();
    try {
        const result = await db.query(`
            SELECT lr.*, lc.name as leave_category_name
            FROM leave_requests lr
            JOIN leave_categories lc ON lr.category_id = lc.id
            WHERE lr.member_id = $1
            ORDER BY lr.start_date DESC
        `, [memberId]);
        return result.rows;
    } catch (error) {
        console.error(`Error fetching leave requests for member ${memberId}:`, error);
        return [];
    }
}

export async function createLeaveRequestAction(data: Omit<LeaveRequest, 'id' | 'status' | 'created_at' | 'updated_at'>): Promise<LeaveRequest | { error: string }> {
    await setupDatabase();
    try {
        const { member_id, category_id, start_date, end_date, days, reason, project, project_lead, direct_report } = data;
        const result = await db.query(
            `INSERT INTO leave_requests (member_id, category_id, start_date, end_date, days, reason, project, project_lead, direct_report)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             RETURNING *`,
            [member_id, category_id, start_date, end_date, days, reason, project, project_lead, direct_report]
        );
        revalidatePath('/admin/leave');
        return result.rows[0];
    } catch (error) {
        console.error('Error creating leave request:', error);
        return { error: 'Failed to submit leave request.' };
    }
}

export async function updateLeaveRequestStatusAction(id: string, status: 'Approved' | 'Rejected', approvedById: string): Promise<{ success: boolean; error?: string }> {
    await setupDatabase();
    try {
        const result = await db.query(
            `UPDATE leave_requests
             SET status = $1, approved_by_id = $2, updated_at = NOW()
             WHERE id = $3`,
            [status, approvedById, id]
        );

        if (result.rowCount === 0) {
            return { success: false, error: 'Leave request not found.' };
        }
        
        // TODO: In a real app, if approved, you would deduct from entitlements here.

        revalidatePath('/admin/leave');
        return { success: true };
    } catch (error) {
        console.error('Error updating leave request status:', error);
        return { success: false, error: 'Failed to update leave request status.' };
    }
}
