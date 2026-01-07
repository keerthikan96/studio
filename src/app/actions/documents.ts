

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
            [title, description, fileUrl, fileType, fileSize, uploadedBy, categoryId || null, !!isCompanyWide]
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

// ========================
// Advanced Sharing Actions
// ========================

type ShareDocumentWithMultipleData = {
    documentId: string;
    userIds?: string[];
    roleIds?: string[];
    accessMode?: 'read_only';
    expiryDate?: Date;
    actorId: string;
}

export async function shareDocumentWithMultiple(data: ShareDocumentWithMultipleData): Promise<{ success: boolean, error?: string }> {
    const { documentId, userIds, roleIds, accessMode, expiryDate, actorId } = data;
    const client = await db.connect();
    
    try {
        await client.query('BEGIN');
        
        // Verify document exists and actor has permission
        const docCheck = await client.query(
            'SELECT uploaded_by FROM documents WHERE id = $1',
            [documentId]
        );
        if (docCheck.rows.length === 0) {
            return { success: false, error: 'Document not found' };
        }

        // Share with users
        if (userIds && userIds.length > 0) {
            for (const userId of userIds) {
                await client.query(
                    `INSERT INTO document_shares (document_id, shared_with_user_id, access_mode, expiry_date, shared_by)
                     VALUES ($1, $2, $3, $4, $5)
                     ON CONFLICT (document_id, shared_with_user_id) DO UPDATE SET 
                        access_mode = EXCLUDED.access_mode,
                        expiry_date = EXCLUDED.expiry_date,
                        shared_at = NOW()`,
                    [documentId, userId, accessMode || 'read_only', expiryDate || null, actorId]
                );
            }
        }

        // Share with roles
        if (roleIds && roleIds.length > 0) {
            for (const roleId of roleIds) {
                await client.query(
                    `INSERT INTO document_shares (document_id, shared_with_role_id, access_mode, expiry_date, shared_by)
                     VALUES ($1, $2, $3, $4, $5)
                     ON CONFLICT (document_id, shared_with_role_id) DO UPDATE SET 
                        access_mode = EXCLUDED.access_mode,
                        expiry_date = EXCLUDED.expiry_date,
                        shared_at = NOW()`,
                    [documentId, roleId, accessMode || 'read_only', expiryDate || null, actorId]
                );
            }
        }

        await logAuditEvent({
            action: 'document.share_multiple',
            resource_type: 'document',
            resource_id: documentId,
            actorId,
            details: { userIds, roleIds, accessMode, expiryDate }
        }, client);

        await client.query('COMMIT');
        return { success: true };
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error sharing document with multiple recipients:', error);
        return { success: false, error: 'Failed to share document' };
    } finally {
        client.release();
    }
}

export async function unshareDocument(shareId: string, actorId: string): Promise<{ success: boolean, error?: string }> {
    const client = await db.connect();
    try {
        await client.query('BEGIN');
        
        const result = await client.query(
            'DELETE FROM document_shares WHERE id = $1 RETURNING document_id',
            [shareId]
        );
        
        if (result.rows.length === 0) {
            return { success: false, error: 'Share not found' };
        }

        await logAuditEvent({
            action: 'document.unshare',
            resource_type: 'document_share',
            resource_id: shareId,
            actorId,
            details: { documentId: result.rows[0].document_id }
        }, client);

        await client.query('COMMIT');
        return { success: true };
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error unsharing document:', error);
        return { success: false, error: 'Failed to unshare document' };
    } finally {
        client.release();
    }
}

export async function getDocumentShares(documentId: string): Promise<any[]> {
    const result = await db.query(
        `SELECT 
            ds.*,
            m.name as shared_with_user_name,
            m.email as shared_with_user_email,
            sharer.name as shared_by_name
        FROM document_shares ds
        LEFT JOIN members m ON ds.shared_with_user_id = m.id
        LEFT JOIN members sharer ON ds.shared_by = sharer.id
        WHERE ds.document_id = $1
        ORDER BY ds.shared_at DESC`,
        [documentId]
    );
    return result.rows;
}

// ========================
// Document CRUD Actions
// ========================

export async function updateDocument(
    id: string, 
    data: { title?: string; description?: string; categoryId?: string; isHidden?: boolean; isCompanyWide?: boolean },
    actorId: string
): Promise<Document | { error: string }> {
    const client = await db.connect();
    try {
        await client.query('BEGIN');
        
        // Check permission
        const docCheck = await client.query(
            'SELECT uploaded_by FROM documents WHERE id = $1',
            [id]
        );
        if (docCheck.rows.length === 0) {
            return { error: 'Document not found' };
        }

        const updates: string[] = [];
        const params: any[] = [];
        let paramCount = 1;

        if (data.title !== undefined) {
            updates.push(`title = $${paramCount++}`);
            params.push(data.title);
        }
        if (data.description !== undefined) {
            updates.push(`description = $${paramCount++}`);
            params.push(data.description);
        }
        if (data.categoryId !== undefined) {
            updates.push(`category_id = $${paramCount++}`);
            params.push(data.categoryId);
        }
        if (data.isHidden !== undefined) {
            updates.push(`is_hidden = $${paramCount++}`);
            params.push(data.isHidden);
        }
        if (data.isCompanyWide !== undefined) {
            updates.push(`is_company_wide = $${paramCount++}`);
            params.push(data.isCompanyWide);
        }

        if (updates.length === 0) {
            return { error: 'No fields to update' };
        }

        params.push(id);
        const result = await client.query(
            `UPDATE documents SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
            params
        );

        await logAuditEvent({
            action: 'document.update',
            resource_type: 'document',
            resource_id: id,
            actorId,
            details: data
        }, client);

        await client.query('COMMIT');
        return result.rows[0];
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error updating document:', error);
        return { error: 'Failed to update document' };
    } finally {
        client.release();
    }
}

export async function deleteDocument(id: string, actorId: string): Promise<{ success: boolean, error?: string }> {
    const client = await db.connect();
    try {
        await client.query('BEGIN');
        
        // Check permission
        const docCheck = await client.query(
            'SELECT uploaded_by, title FROM documents WHERE id = $1',
            [id]
        );
        if (docCheck.rows.length === 0) {
            return { success: false, error: 'Document not found' };
        }

        // Delete document (cascades to shares, versions, comments)
        await client.query('DELETE FROM documents WHERE id = $1', [id]);

        await logAuditEvent({
            action: 'document.delete',
            resource_type: 'document',
            resource_id: id,
            actorId,
            details: { title: docCheck.rows[0].title }
        }, client);

        await client.query('COMMIT');
        return { success: true };
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error deleting document:', error);
        return { success: false, error: 'Failed to delete document' };
    } finally {
        client.release();
    }
}

export async function getSharedDocuments(userId: string): Promise<Document[]> {
    const result = await db.query(
        `SELECT DISTINCT
            d.*, 
            dc.name as category_name,
            m.name as uploader_name,
            ds.shared_at,
            ds.access_mode,
            ds.expiry_date
        FROM documents d
        LEFT JOIN document_categories dc ON d.category_id = dc.id
        LEFT JOIN members m ON d.uploaded_by = m.id
        INNER JOIN document_shares ds ON d.id = ds.document_id
        LEFT JOIN members shared_user ON ds.shared_with_user_id = shared_user.id
        WHERE (ds.shared_with_user_id = $1 OR ds.shared_with_role_id IN (
            SELECT role FROM members WHERE id = $1
        ))
        AND (ds.expiry_date IS NULL OR ds.expiry_date > NOW())
        AND d.is_hidden = false
        ORDER BY ds.shared_at DESC`,
        [userId]
    );
    return result.rows;
}

// ========================
// Versioning Actions
// ========================

export async function uploadDocumentVersion(
    documentId: string,
    fileUrl: string,
    uploadedBy: string
): Promise<{ success: boolean, version: number, error?: string }> {
    const client = await db.connect();
    try {
        await client.query('BEGIN');
        
        // Get current version
        const docResult = await client.query(
            'SELECT version, uploaded_by FROM documents WHERE id = $1',
            [documentId]
        );
        
        if (docResult.rows.length === 0) {
            return { success: false, version: 0, error: 'Document not found' };
        }

        const currentVersion = docResult.rows[0].version;
        const newVersion = currentVersion + 1;

        // Archive current version
        await client.query(
            `INSERT INTO document_versions (document_id, version_number, file_url, uploaded_by)
             SELECT id, version, file_url, $2 FROM documents WHERE id = $1`,
            [documentId, uploadedBy]
        );

        // Update document with new version
        await client.query(
            'UPDATE documents SET file_url = $1, version = $2 WHERE id = $3',
            [fileUrl, newVersion, documentId]
        );

        await logAuditEvent({
            action: 'document.version_upload',
            resource_type: 'document',
            resource_id: documentId,
            actorId: uploadedBy,
            details: { version: newVersion }
        }, client);

        await client.query('COMMIT');
        return { success: true, version: newVersion };
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error uploading document version:', error);
        return { success: false, version: 0, error: 'Failed to upload version' };
    } finally {
        client.release();
    }
}

export async function getDocumentVersions(documentId: string): Promise<any[]> {
    const result = await db.query(
        `SELECT 
            dv.*,
            m.name as uploader_name
        FROM document_versions dv
        LEFT JOIN members m ON dv.uploaded_by = m.id
        WHERE dv.document_id = $1
        ORDER BY dv.version_number DESC`,
        [documentId]
    );
    return result.rows;
}

export async function restoreDocumentVersion(
    documentId: string,
    versionId: string,
    actorId: string
): Promise<{ success: boolean, error?: string }> {
    const client = await db.connect();
    try {
        await client.query('BEGIN');
        
        // Get version details
        const versionResult = await client.query(
            'SELECT file_url, version_number FROM document_versions WHERE id = $1 AND document_id = $2',
            [versionId, documentId]
        );
        
        if (versionResult.rows.length === 0) {
            return { success: false, error: 'Version not found' };
        }

        const { file_url, version_number } = versionResult.rows[0];

        // Archive current version before restoring
        await client.query(
            `INSERT INTO document_versions (document_id, version_number, file_url, uploaded_by)
             SELECT id, version, file_url, $2 FROM documents WHERE id = $1`,
            [documentId, actorId]
        );

        // Update document to restored version
        const docResult = await client.query(
            'SELECT version FROM documents WHERE id = $1',
            [documentId]
        );
        const newVersion = docResult.rows[0].version + 1;

        await client.query(
            'UPDATE documents SET file_url = $1, version = $2 WHERE id = $3',
            [file_url, newVersion, documentId]
        );

        await logAuditEvent({
            action: 'document.version_restore',
            resource_type: 'document',
            resource_id: documentId,
            actorId,
            details: { restoredVersion: version_number, newVersion }
        }, client);

        await client.query('COMMIT');
        return { success: true };
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error restoring document version:', error);
        return { success: false, error: 'Failed to restore version' };
    } finally {
        client.release();
    }
}

// ========================
// Comments Actions
// ========================

export async function addDocumentComment(
    documentId: string,
    userId: string,
    commentText: string
): Promise<any | { error: string }> {
    const client = await db.connect();
    try {
        await client.query('BEGIN');
        
        const result = await client.query(
            `INSERT INTO document_comments (document_id, user_id, comment_text)
             VALUES ($1, $2, $3) RETURNING *`,
            [documentId, userId, commentText]
        );

        const comment = result.rows[0];

        await logAuditEvent({
            action: 'document.comment_add',
            resource_type: 'document',
            resource_id: documentId,
            actorId: userId,
            details: { commentId: comment.id }
        }, client);

        await client.query('COMMIT');
        
        // Get comment with user info
        const commentWithUser = await db.query(
            `SELECT dc.*, m.name as user_name, m.profile_picture as user_avatar
             FROM document_comments dc
             LEFT JOIN members m ON dc.user_id = m.id
             WHERE dc.id = $1`,
            [comment.id]
        );
        
        return commentWithUser.rows[0];
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error adding comment:', error);
        return { error: 'Failed to add comment' };
    } finally {
        client.release();
    }
}

export async function getDocumentComments(documentId: string): Promise<any[]> {
    const result = await db.query(
        `SELECT 
            dc.*,
            m.name as user_name,
            m.profile_picture as user_avatar
        FROM document_comments dc
        LEFT JOIN members m ON dc.user_id = m.id
        WHERE dc.document_id = $1
        ORDER BY dc.created_at ASC`,
        [documentId]
    );
    return result.rows;
}

export async function deleteDocumentComment(
    commentId: string,
    userId: string
): Promise<{ success: boolean, error?: string }> {
    const client = await db.connect();
    try {
        await client.query('BEGIN');
        
        // Check if user owns the comment
        const commentCheck = await client.query(
            'SELECT document_id FROM document_comments WHERE id = $1 AND user_id = $2',
            [commentId, userId]
        );
        
        if (commentCheck.rows.length === 0) {
            return { success: false, error: 'Comment not found or unauthorized' };
        }

        await client.query('DELETE FROM document_comments WHERE id = $1', [commentId]);

        await logAuditEvent({
            action: 'document.comment_delete',
            resource_type: 'document_comment',
            resource_id: commentId,
            actorId: userId,
            details: { documentId: commentCheck.rows[0].document_id }
        }, client);

        await client.query('COMMIT');
        return { success: true };
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error deleting comment:', error);
        return { success: false, error: 'Failed to delete comment' };
    } finally {
        client.release();
    }
}

// ========================
// Search & Filter Actions
// ========================

type SearchDocumentsParams = {
    searchTerm?: string;
    categoryId?: string;
    fileType?: string;
    dateFrom?: Date;
    dateTo?: Date;
    uploadedBy?: string;
    minSize?: number;
    maxSize?: number;
    userId: string; // For permission filtering
}

export async function searchDocuments(params: SearchDocumentsParams): Promise<Document[]> {
    const { searchTerm, categoryId, fileType, dateFrom, dateTo, uploadedBy, minSize, maxSize, userId } = params;
    
    let query = `
        SELECT DISTINCT
            d.*, 
            dc.name as category_name,
            m.name as uploader_name
        FROM documents d
        LEFT JOIN document_categories dc ON d.category_id = dc.id
        LEFT JOIN members m ON d.uploaded_by = m.id
        LEFT JOIN document_shares ds ON d.id = ds.document_id
        WHERE (
            d.uploaded_by = $1 
            OR d.is_company_wide = true 
            OR ds.shared_with_user_id = $1
            OR ds.shared_with_role_id IN (SELECT role FROM members WHERE id = $1)
        )
        AND d.is_hidden = false
    `;
    
    const queryParams: any[] = [userId];
    let paramCount = 2;

    if (searchTerm) {
        query += ` AND (d.title ILIKE $${paramCount} OR d.description ILIKE $${paramCount})`;
        queryParams.push(`%${searchTerm}%`);
        paramCount++;
    }

    if (categoryId) {
        query += ` AND d.category_id = $${paramCount}`;
        queryParams.push(categoryId);
        paramCount++;
    }

    if (fileType) {
        query += ` AND d.file_type = $${paramCount}`;
        queryParams.push(fileType);
        paramCount++;
    }

    if (dateFrom) {
        query += ` AND d.created_at >= $${paramCount}`;
        queryParams.push(dateFrom);
        paramCount++;
    }

    if (dateTo) {
        query += ` AND d.created_at <= $${paramCount}`;
        queryParams.push(dateTo);
        paramCount++;
    }

    if (uploadedBy) {
        query += ` AND d.uploaded_by = $${paramCount}`;
        queryParams.push(uploadedBy);
        paramCount++;
    }

    if (minSize) {
        query += ` AND d.file_size >= $${paramCount}`;
        queryParams.push(minSize);
        paramCount++;
    }

    if (maxSize) {
        query += ` AND d.file_size <= $${paramCount}`;
        queryParams.push(maxSize);
        paramCount++;
    }

    query += ' ORDER BY d.created_at DESC';

    const result = await db.query(query, queryParams);
    return result.rows;
}
