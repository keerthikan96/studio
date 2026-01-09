import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
    try {
        const result = await db.query(`
            SELECT 
                id, 
                name, 
                email, 
                job_title, 
                profile_picture_url,
                status
            FROM members 
            WHERE status = 'active'
            ORDER BY name ASC
        `);
        
        return NextResponse.json(result.rows);
    } catch (error) {
        console.error('Error fetching members:', error);
        return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 });
    }
}
