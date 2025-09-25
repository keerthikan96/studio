
import { NextRequest, NextResponse } from 'next/server';
import { getAssessmentCategoriesAction, addAssessmentCategoryAction, deleteAssessmentCategoryAction } from '@/app/actions/staff';

export async function GET(req: NextRequest) {
    try {
        const categories = await getAssessmentCategoriesAction();
        return NextResponse.json(categories);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Internal server error';
        console.error('Failed to fetch assessment categories:', error);
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const { name } = await req.json();
        if (!name) {
            return NextResponse.json({ error: 'Category name is required.' }, { status: 400 });
        }
        const result = await addAssessmentCategoryAction(name);
        if ('error' in result) {
            return NextResponse.json({ error: result.error }, { status: 409 }); // Conflict or Bad Request
        }
        return NextResponse.json(result, { status: 201 });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Internal server error';
        console.error('Failed to add assessment category:', error);
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const { id } = await req.json();
        if (!id) {
            return NextResponse.json({ error: 'Category ID is required.' }, { status: 400 });
        }
        const result = await deleteAssessmentCategoryAction(id);
        if (!result.success) {
            return NextResponse.json({ error: result.error || 'Failed to delete category.' }, { status: 404 });
        }
        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Internal server error';
        console.error('Failed to delete assessment category:', error);
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
