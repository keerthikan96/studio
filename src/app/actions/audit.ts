
'use server';

import { db } from '@/lib/db';
import { PoolClient } from 'pg';

export type AuditLog = {
    id: string;
    actor_id?: string;
    actor_name?: string;
    action: string;
    resource_type?: string;
    resource_id?: string;
    details?: any;
    created_at: string;
};

export async function getAuditLogsAction(): Promise<AuditLog[]> {
    try {
        const result = await db.query('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 100');
        return result.rows;
    } catch (error) {
        console.error('Error fetching audit logs:', error);
        return [];
    }
}

type LogAuditEventParams = {
    actorId?: string;
    actorName?: string;
    action: string;
    resource_type?: string;
    resource_id?: string;
    details?: any;
};

export async function logAuditEvent(params: LogAuditEventParams, client?: PoolClient) {
    const { actorId, actorName, action, resource_type, resource_id, details } = params;
    const queryRunner = client || db;
    try {
        // In a real app, actorId and actorName would be extracted from the authenticated user session
        await queryRunner.query(
            `INSERT INTO audit_logs (actor_id, actor_name, action, resource_type, resource_id, details)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [actorId || 'system', actorName || 'System', action, resource_type, resource_id, details ? JSON.stringify(details) : null]
        );
    } catch (error) {
        console.error('Failed to write audit log:', error);
        // We typically don't want to fail the parent transaction if logging fails,
        // so we just log the error and continue.
    }
}
