
'use server';

import { db } from '@/lib/db';
import { logAuditEvent } from './audit';
import { PoolClient } from 'pg';

export type DocumentCategory = {
    id: string;
    name: string;
    created_at: string;
    created_by: string;
};

export type Document = {
    id: string;
    title: string;
    description?: string;
    category_id?: string;
    file_url: string;
    file_type?: string;
    file_size?: number;
    version: number;
    uploaded_by: string;
    created_at: string;
    is_hidden: boolean;
    is_company_wide: boolean;
    category_name?: string;
    uploader_name?: string;
};

// ========================
// Category Actions
// ========================

export async function createDocumentCategory(name: string, createdById: string): Promise<DocumentCategory | { error: string }> {
    const client = await db.connect();
    try {
        await client.query('BEGIN');
        const result = await client.query(
            'INSERT INTO document_categories (name, created_by) VALUES ($1, $2) RETURNING *',
            [name, createdById]
        );
        const newCategory = result.rows[0];
        
        await logAuditEvent({
            action: 'document_category.create',
            resource_type: 'document_category',
            resource_id: newCategory.id,
            actorId: createdById,
            details: { name }
        }, client);

        await client.query('COMMIT');
        return newCategory;
    } catch (error: any) {
        await client.query('ROLLBACK');
        console.error("Error creating document category:", error);
        if (error.code === '23505') {
            return { error: 'A category with this name already exists.' };
        }
        return { error: 'Failed to create category.' };
    } finally {
        client.release();
    }
}

export async function getDocumentCategories(): Promise<DocumentCategory[]> {
    const result = await db.query('SELECT * FROM document_categories ORDER BY name ASC');
    return result.rows;
}

export async function updateDocumentCategory(id: string, name: string, actorId: string): Promise<DocumentCategory | { error: string }> {
     const client = await db.connect();
    try {
        await client.query('BEGIN');
        const result = await client.query(
            'UPDATE document_categories SET name = $1 WHERE id = $2 RETURNING *',
            [name, id]
        );
         if (result.rows.length === 0) {
            return { error: "Category not found." };
        }
        const updatedCategory = result.rows[0];
        
        await logAuditEvent({
            action: 'document_category.update',
            resource_type: 'document_category',
            resource_id: updatedCategory.id,
            actorId: actorId,
            details: { name }
        }, client);

        await client.query('COMMIT');
        return updatedCategory;
    } catch (error: any) {
        await client.query('ROLLBACK');
        console.error("Error updating document category:", error);
         if (error.code === '23505') {
            return { error: 'A category with this name already exists.' };
        }
        return { error: 'Failed to update category.' };
    } finally {
        client.release();
    }
}

export async function deleteDocumentCategory(id: string, actorId: string): Promise<{ success: boolean, error?: string }> {
    const client = await db.connect();
    try {
        await client.query('BEGIN');
        // Check if category is in use
        const usageCheck = await client.query('SELECT 1 FROM documents WHERE category_id = $1 LIMIT 1', [id]);
        if (usageCheck.rows.length > 0) {
            return { success: false, error: 'Cannot delete category as it is currently in use by one or more documents.' };
        }

        const result = await client.query('DELETE FROM document_categories WHERE id = $1', [id]);
        if (result.rowCount === 0) {
            return { success: false, error: "Category not found." };
        }
        
        await logAuditEvent({
            action: 'document_category.delete',
            resource_type: 'document_category',
            resource_id: id,
            actorId: actorId,
        }, client);

        await client.query('COMMIT');
        return { success: true };
    } catch (error) {
        await client.query('ROLLBACK');
        console.error("Error deleting document category:", error);
        return { success: false, error: 'An unexpected error occurred while deleting the category.' };
    } finally {
        client.release();
    }
}


// ========================
// Document Actions
// ========================

type UploadDocumentData = {
    title: string;
    description: string;
    fileUrl: string;
    fileType: string;
    fileSize: number;
    uploadedBy: string;
    categoryId?: string;
    isCompanyWide?: boolean;
}

export async function uploadDocument(data: UploadDocumentData): Promise<Document> {
    const { title, description, fileUrl, fileType, fileSize, uploadedBy, categoryId, isCompanyWide } = data;
    const client = await db.connect();
    try {
        await client.query('BEGIN');
        const result = await client.query(
            `INSERT INTO documents (title, description, file_url, file_type, file_size, uploaded_by, category_id, is_company_wide)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
            [title, description, fileUrl, fileType, fileSize, uploadedBy, categoryId, !!isCompanyWide]
        );
        const newDocument = result.rows[0];

        await logAuditEvent({
            action: 'document.upload',
            resource_type: 'document',
            resource_id: newDocument.id,
            actorId: uploadedBy,
            details: { title, categoryId, isCompanyWide }
        }, client);
        
        await client.query('COMMIT');
        return newDocument;

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error uploading document:', error);
        throw error;
    } finally {
        client.release();
    }
}

type GetDocumentsFilter = {
    ownerId?: string;
    sharedWithId?: string;
    isCompanyWide?: boolean;
    categoryId?: string;
}

export async function getDocuments(filter: GetDocumentsFilter, actorId: string): Promise<Document[]> {
    // This is a simplified version. A real implementation would have complex permission checks.
    let query = `
        SELECT 
            d.*, 
            dc.name as category_name,
            m.name as uploader_name 
        FROM documents d
        LEFT JOIN document_categories dc ON d.category_id = dc.id
        LEFT JOIN members m ON d.uploaded_by = m.id
    `;
    const params = [];
    const whereClauses = [];

    if (filter.ownerId) {
        params.push(filter.ownerId);
        whereClauses.push(`d.uploaded_by = $${params.length}`);
    }
     if (filter.isCompanyWide) {
        whereClauses.push(`d.is_company_wide = true`);
    }
    
    if (whereClauses.length > 0) {
        query += ' WHERE ' + whereClauses.join(' AND ');
    }
    
    query += ' ORDER BY d.created_at DESC';

    const result = await db.query(query, params);
    return result.rows;
}

export async function shareDocument(documentId: string, shareWithUserId: string, actorId: string): Promise<{ success: boolean }> {
    const client = await db.connect();
    try {
        await client.query('BEGIN');
        await client.query(
            'INSERT INTO document_shares (document_id, shared_with_user_id, shared_by) VALUES ($1, $2, $3)',
            [documentId, shareWithUserId, actorId]
        );

         await logAuditEvent({
            action: 'document.share',
            resource_type: 'document',
            resource_id: documentId,
            actorId,
            details: { shared_with: shareWithUserId }
        }, client);
        
        await client.query('COMMIT');
        return { success: true };
    } catch (error) {
        await client.query('ROLLBACK');
        console.error("Error sharing document:", error);
        throw error;
    } finally {
        client.release();
    }
}
