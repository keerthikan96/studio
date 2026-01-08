import { NextRequest, NextResponse } from 'next/server';
import { getUserPermissions } from '@/lib/permission-utils';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const permissions = await getUserPermissions(userId);

    return NextResponse.json({ permissions });
  } catch (error) {
    console.error('Error in permissions API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch permissions' },
      { status: 500 }
    );
  }
}
