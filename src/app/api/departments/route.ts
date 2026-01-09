import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
    try {
        const result = await db.query(`
            SELECT 
                id, 
                name,
                description
            FROM departments 
            ORDER BY name ASC
        `);
        
        return NextResponse.json(result.rows);
    } catch (error) {
        console.error('Error fetching departments:', error);
        return NextResponse.json({ error: 'Failed to fetch departments' }, { status: 500 });
    }
}
