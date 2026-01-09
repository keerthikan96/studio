import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
    try {
        const result = await db.query(`
            SELECT 
                d.id, 
                d.name,
                d.description,
                d.lead_id,
                d.supervisor_id,
                l.name as lead_name,
                s.name as supervisor_name
            FROM departments d
            LEFT JOIN members l ON d.lead_id = l.id
            LEFT JOIN members s ON d.supervisor_id = s.id
            ORDER BY d.name ASC
        `);
        
        return NextResponse.json(result.rows);
    } catch (error) {
        console.error('Error fetching departments:', error);
        return NextResponse.json({ error: 'Failed to fetch departments' }, { status: 500 });
    }
}
