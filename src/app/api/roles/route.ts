import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hasPermission } from '@/lib/permission-utils';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json(
                { error: 'User ID is required' },
                { status: 400 }
            );
        }

        // Check permission
        const canRead = await hasPermission(userId, 'roles.read');
        if (!canRead) {
            return NextResponse.json(
                { error: 'Permission denied' },
                { status: 403 }
            );
        }

        const result = await db.query(
            'SELECT id, name, description FROM roles ORDER BY name ASC'
        );

        return NextResponse.json(result.rows);
    } catch (error) {
        console.error('Error fetching roles:', error);
        return NextResponse.json(
            { error: 'Failed to fetch roles' },
            { status: 500 }
        );
    }
}
