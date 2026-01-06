

'use server';

import {
  parseResumeToAutofillProfile,
  ParseResumeToAutofillProfileInput,
  ParseResumeToAutofillProfileOutput,
} from '@/ai/flows/resume-parsing-to-autofill-profile';
import { db, setupDatabase } from '@/lib/db';
import { Member, Note, PerformanceRecord, SelfEvaluation, Document, CourseOrCertificate, AssessmentCategory, Role } from '@/lib/mock-data';
import { requestPasswordResetAction } from './auth';
import { uploadFileToAzure } from '@/lib/azure-blob-storage';
import { logAuditEvent } from './audit';
import { PoolClient } from 'pg';

export async function parseResumeAction(
  input: ParseResumeToAutofillProfileInput
): Promise<ParseResumeToAutofillProfileOutput | { error: string }> {
  try {
    const result = await parseResumeToAutofillProfile(input);
    return result;
  } catch (error: any) {
    console.error('Error parsing resume:', error);
    // Return the specific error message from the underlying service
    const errorMessage = error.message || 'An unknown error occurred during parsing.';
    return { error: `Failed to parse resume: ${errorMessage}` };
  }
}

async function logWithClient(client: PoolClient, params: any) {
    // In a real app, actorId and actorName would come from session
    await logAuditEvent({
        actorId: 'admin-user-001',
        actorName: 'People and Culture office',
        ...params
    }, client);
}

export async function addStaffAction(staffData: { staff: Omit<Member, 'id' | 'status' | 'profile_picture_url' | 'cover_photo_url' | 'name' | 'hobbies'>, sendInvite: boolean, isDraft: boolean, resumeFile?: { file: File, dataUri: string }, role_id: string }): Promise<{ member: Member, invitationLink?: string } | { error: string }> {
  await setupDatabase();
  const { staff, sendInvite, isDraft, resumeFile, role_id } = staffData;

  const name = [staff.first_name, staff.middle_name, staff.last_name].filter(Boolean).join(' ');

  const { 
      first_name, middle_name, last_name, gender, email, phone, street_address, city, state_province, postal_code, country, 
      domain, branch, experience, education, skills, job_title, date_of_birth, start_date, 
      emergency_contact_name, emergency_contact_phone, emergency_contact_relationship,
      citizenship, national_id, passport_no, visa_work_permit, visa_work_permit_expiry,
      employee_id, employment_type, employee_level, reporting_supervisor_id, volunteer_work
  } = staff;

  const status = isDraft ? 'pending' : 'active';
  const client = await db.connect();

  try {
    await client.query('BEGIN');

    const result = await client.query(
      `INSERT INTO members (
        name, first_name, middle_name, last_name, gender, email, phone, street_address, city, state_province, postal_code, country,
        domain, branch, experience, education, skills, status, job_title, date_of_birth, start_date, 
        emergency_contact_name, emergency_contact_phone, emergency_contact_relationship,
        citizenship, national_id, passport_no, visa_work_permit, visa_work_permit_expiry,
        employee_id, employment_type, employee_level, reporting_supervisor_id, volunteer_work
        )
        VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21,
        $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34
        )
        RETURNING *;`,
      [
        name, first_name, middle_name, last_name, gender, email, phone, street_address, city, state_province, postal_code, country,
        domain, branch, JSON.stringify(experience || []), JSON.stringify(education || []), JSON.stringify(skills || []), status, job_title, date_of_birth, start_date,
        emergency_contact_name, emergency_contact_phone, emergency_contact_relationship,
        citizenship, national_id, passport_no, visa_work_permit, visa_work_permit_expiry,
        employee_id, employment_type, employee_level, reporting_supervisor_id, JSON.stringify(volunteer_work || [])
      ]
    );
    const newMember = result.rows[0];
    
    await client.query(
      'INSERT INTO role_members (member_id, role_id) VALUES ($1, $2)',
      [newMember.id, role_id]
    );

    if (resumeFile && resumeFile.file.size > 0) {
      const buffer = Buffer.from(await resumeFile.file.arrayBuffer());
      const destination = `resumes/${newMember.id}/${Date.now()}-${resumeFile.file.name}`;
      const publicUrl = await uploadFileToAzure(buffer, destination);
      
      await client.query(
        `INSERT INTO member_documents (member_id, name, description, file_url, file_type, file_size)
          VALUES ($1, $2, $3, $4, $5, $6);`,
        [newMember.id, 'Resume', 'Uploaded during employee creation.', publicUrl, resumeFile.file.type, resumeFile.file.size]
      );
    }

    await logWithClient(client, {
        action: 'staff.create',
        resource_type: 'member',
        resource_id: newMember.id,
        details: { email: newMember.email, name: newMember.name, status: newMember.status }
    });

    let invitationLink: string | undefined = undefined;
    if (sendInvite && !isDraft) {
        const inviteResult = await requestPasswordResetAction(newMember.email, true);
        if (inviteResult.success && inviteResult.invitationLink) {
            invitationLink = inviteResult.invitationLink;
        } else {
            console.error("Failed to generate invitation link for new member:", inviteResult.error);
        }
    }

    await client.query('COMMIT');
    return { member: newMember, invitationLink };

  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Error adding staff member:', error);
    if (error.code === '23505') {
        return { error: `A member with this email or employee ID already exists.` };
    }
    return { error: error.message || 'An unexpected error occurred while saving the member.' };
  } finally {
      client.release();
  }
}

export async function getMembersAction(): Promise<Member[]> {
    await setupDatabase();
    try {
        const result = await db.query(`
            SELECT m.*, r.name as role
            FROM members m
            LEFT JOIN role_members rm ON m.id = rm.member_id
            LEFT JOIN roles r ON rm.role_id = r.id
            ORDER BY m.created_at DESC
        `);
        return result.rows;
    } catch (error) {
        console.error('Error fetching members:', error);
        return [];
    }
}

export async function getMemberByIdAction(id: string): Promise<Member | null> {
    try {
        const result = await db.query(`
            SELECT m.*, r.id as role_id, r.name as role
            FROM members m
            LEFT JOIN role_members rm ON m.id = rm.member_id
            LEFT JOIN roles r ON rm.role_id = r.id
            WHERE m.id = $1
        `, [id]);
        if (result.rows.length === 0) return null;
        return result.rows[0];
    } catch (error) {
        console.error(`Error fetching member with id ${id}:`, error);
        return null;
    }
}

export async function updateMemberAction(id: string, data: Omit<Partial<Member>, 'id' | 'created_at' | 'updated_at'>): Promise<Member | { error: string }> {
    const { name, email, phone, domain, country, branch, experience, education, skills, status, profile_picture_url, cover_photo_url, job_title, date_of_birth, start_date, address, emergency_contact_name, emergency_contact_phone, hobbies, volunteer_work, role_id } = data;
    const client = await db.connect();
    try {
        await client.query('BEGIN');
        const fields: string[] = [];
        const values: any[] = [];
        let fieldIndex = 1;

        if (name !== undefined) { fields.push(`name = $${fieldIndex++}`); values.push(name); }
        if (email !== undefined) { fields.push(`email = $${fieldIndex++}`); values.push(email); }
        if (phone !== undefined) { fields.push(`phone = $${fieldIndex++}`); values.push(phone); }
        if (domain !== undefined) { fields.push(`domain = $${fieldIndex++}`); values.push(domain); }
        if (country !== undefined) { fields.push(`country = $${fieldIndex++}`); values.push(country); }
        if (branch !== undefined) { fields.push(`branch = $${fieldIndex++}`); values.push(branch); }
        if (experience !== undefined) { fields.push(`experience = $${fieldIndex++}`); values.push(JSON.stringify(experience)); }
        if (education !== undefined) { fields.push(`education = $${fieldIndex++}`); values.push(JSON.stringify(education)); }
        if (skills !== undefined) { fields.push(`skills = $${fieldIndex++}`); values.push(JSON.stringify(skills)); }
        if (status !== undefined) { fields.push(`status = $${fieldIndex++}`); values.push(status); }
        if (profile_picture_url !== undefined) { fields.push(`profile_picture_url = $${fieldIndex++}`); values.push(profile_picture_url); }
        if (cover_photo_url !== undefined) { fields.push(`cover_photo_url = $${fieldIndex++}`); values.push(cover_photo_url); }
        if (job_title !== undefined) { fields.push(`job_title = $${fieldIndex++}`); values.push(job_title); }
        if (date_of_birth !== undefined) { fields.push(`date_of_birth = $${fieldIndex++}`); values.push(date_of_birth); }
        if (start_date !== undefined) { fields.push(`start_date = $${fieldIndex++}`); values.push(start_date); }
        if (address !== undefined) { fields.push(`address = $${fieldIndex++}`); values.push(address); }
        if (emergency_contact_name !== undefined) { fields.push(`emergency_contact_name = $${fieldIndex++}`); values.push(emergency_contact_name); }
        if (emergency_contact_phone !== undefined) { fields.push(`emergency_contact_phone = $${fieldIndex++}`); values.push(emergency_contact_phone); }
        if (hobbies !== undefined) { fields.push(`hobbies = $${fieldIndex++}`); values.push(JSON.stringify(hobbies)); }
        if (volunteer_work !== undefined) { fields.push(`volunteer_work = $${fieldIndex++}`); values.push(JSON.stringify(volunteer_work)); }
        
        if (fields.length > 0) {
            fields.push(`updated_at = NOW()`);
            values.push(id);

            const queryString = `UPDATE members SET ${fields.join(', ')} WHERE id = $${fieldIndex} RETURNING *;`;
            await client.query(queryString, values);
        }
        
        if (role_id) {
            await client.query('DELETE FROM role_members WHERE member_id = $1', [id]);
            await client.query('INSERT INTO role_members (member_id, role_id) VALUES ($1, $2)', [id, role_id]);
        }

        await logWithClient(client, {
            action: 'staff.update',
            resource_type: 'member',
            resource_id: id,
            details: data 
        });

        await client.query('COMMIT');
        
        const updatedMember = await getMemberByIdAction(id);
        if (!updatedMember) return { error: "Failed to retrieve updated member."};

        return updatedMember;

    } catch (error) {
        await client.query('ROLLBACK');
        console.error(`Error updating member with id ${id}:`, error);
        return { error: 'Failed to update member profile.' };
    } finally {
        client.release();
    }
}

export async function addNoteAction(data: Omit<Note, 'id' | 'created_at'>): Promise<Note | { error: string }> {
  const { member_id, created_by_id, created_by_name, note_name, description, is_confidential, attachments, tags, pinned, mentions } = data;
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query(
      `INSERT INTO member_notes (member_id, created_by_id, created_by_name, note_name, description, is_confidential, attachments, tags, pinned, mentions)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *;`,
      [member_id, created_by_id, created_by_name, note_name, description, is_confidential, JSON.stringify(attachments), tags, pinned, mentions]
    );
    const newNote = result.rows[0];
    await logAuditEvent({
        actorId: created_by_id,
        actorName: created_by_name,
        action: 'note.create',
        resource_type: 'member_note',
        resource_id: newNote.id,
        details: { member_id, note_name, is_confidential }
    }, client);
    await client.query('COMMIT');
    return newNote;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error adding note:', error);
    return { error: 'Failed to add note.' };
  } finally {
      client.release();
  }
}

export async function getNotesAction(memberId: string): Promise<Note[]> {
  try {
    const result = await db.query('SELECT * FROM member_notes WHERE member_id = $1 ORDER BY pinned DESC, created_at DESC', [memberId]);
    return result.rows;
  } catch (error) {
    console.error(`Error fetching notes for member ${memberId}:`, error);
    return [];
  }
}

export async function addPerformanceRecordAction(data: Omit<PerformanceRecord, 'id' | 'created_at'>): Promise<PerformanceRecord | { error: string }> {
  const { member_id, reviewer_id, reviewer_name, review_date, score, comments, tags, attachments, is_confidential, pinned } = data;
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query(
      `INSERT INTO performance_records (member_id, reviewer_id, reviewer_name, review_date, score, comments, tags, attachments, is_confidential, pinned)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *;`,
      [member_id, reviewer_id, reviewer_name, review_date, score, comments, tags, JSON.stringify(attachments), is_confidential, pinned]
    );
    const newRecord = result.rows[0];
    await logAuditEvent({
        actorId: reviewer_id,
        actorName: reviewer_name,
        action: 'performance.create',
        resource_type: 'performance_record',
        resource_id: newRecord.id,
        details: { member_id, review_date, score }
    }, client);
    await client.query('COMMIT');
    return newRecord;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error adding performance record:', error);
    return { error: 'Failed to add performance record.' };
  } finally {
      client.release();
  }
}

export async function getPerformanceRecordsAction(memberId: string): Promise<PerformanceRecord[]> {
  try {
    const result = await db.query('SELECT * FROM performance_records WHERE member_id = $1 ORDER BY review_date DESC', [memberId]);
    return result.rows;
  } catch (error) {
    console.error(`Error fetching performance records for member ${memberId}:`, error);
    return [];
  }
}

export async function addSelfEvaluationAction(data: Omit<SelfEvaluation, 'id' | 'created_at' | 'status' | 'hr_feedback' | 'finalized_by_id' | 'finalized_by_name' | 'finalized_at'>): Promise<SelfEvaluation | { error: string }> {
  const { member_id, evaluation_date, self_rating, comments, other_comments, tags, attachments } = data;
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query(
      `INSERT INTO self_evaluations (member_id, evaluation_date, self_rating, comments, other_comments, tags, attachments)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *;`,
      [member_id, evaluation_date, self_rating, JSON.stringify(comments), other_comments, tags, JSON.stringify(attachments)]
    );
    const newEval = result.rows[0];
    await logAuditEvent({
        actorId: member_id, 
        action: 'self_evaluation.create',
        resource_type: 'self_evaluation',
        resource_id: newEval.id,
        details: { member_id, evaluation_date }
    }, client);
    await client.query('COMMIT');
    return newEval;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error adding self-evaluation:', error);
    return { error: 'Failed to add self-evaluation record.' };
  } finally {
      client.release();
  }
}

export async function getSelfEvaluationsAction(memberId: string): Promise<SelfEvaluation[]> {
  try {
    const result = await db.query('SELECT * FROM self_evaluations WHERE member_id = $1 ORDER BY evaluation_date DESC', [memberId]);
    return result.rows;
  } catch (error) {
    console.error(`Error fetching self-evaluations for member ${memberId}:`, error);
    return [];
  }
}

export async function updateSelfEvaluationAction(id: string, data: Partial<Pick<SelfEvaluation, 'hr_feedback' | 'status' | 'finalized_by_id' | 'finalized_by_name'>>): Promise<SelfEvaluation | { error: string }> {
  const { hr_feedback, status, finalized_by_id, finalized_by_name } = data;
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query(
      `UPDATE self_evaluations 
       SET hr_feedback = $1, status = $2, finalized_by_id = $3, finalized_by_name = $4, finalized_at = NOW()
       WHERE id = $5
       RETURNING *;`,
      [hr_feedback, status, finalized_by_id, finalized_by_name, id]
    );
    const updatedEval = result.rows[0];
    await logAuditEvent({
        actorId: finalized_by_id,
        actorName: finalized_by_name,
        action: 'self_evaluation.finalize',
        resource_type: 'self_evaluation',
        resource_id: id,
        details: { status }
    }, client);
    await client.query('COMMIT');
    return updatedEval;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`Error updating self-evaluation with id ${id}:`, error);
    return { error: 'Failed to update self-evaluation.' };
  } finally {
      client.release();
  }
}

export async function getDocumentsAction(memberId: string): Promise<Document[]> {
  await setupDatabase();
  try {
    const result = await db.query('SELECT * FROM member_documents WHERE member_id = $1 ORDER BY created_at DESC', [memberId]);
    return result.rows;
  } catch (error) {
    console.error(`Error fetching documents for member ${memberId}:`, error);
    return [];
  }
}

export async function addDocumentAction(data: Omit<Document, 'id' | 'created_at'>): Promise<Document | { error: string }> {
  const { member_id, name, description, file_url, file_type, file_size } = data;
   const client = await db.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query(
      `INSERT INTO member_documents (member_id, name, description, file_url, file_type, file_size)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *;`,
      [member_id, name, description, file_url, file_type, file_size]
    );
    const newDoc = result.rows[0];
    await logWithClient(client, {
        action: 'document.create',
        resource_type: 'member_document',
        resource_id: newDoc.id,
        details: { name, file_type, member_id }
    });
    await client.query('COMMIT');
    return newDoc;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error adding document:', error);
    return { error: 'Failed to add document.' };
  } finally {
      client.release();
  }
}

export async function updateDocumentAction(docId: string, data: { name: string, description: string }): Promise<Document | { error: string }> {
  const { name, description } = data;
   const client = await db.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query(
      `UPDATE member_documents SET name = $1, description = $2 WHERE id = $3 RETURNING *;`,
      [name, description, docId]
    );
    if (result.rows.length === 0) {
      return { error: 'Document not found.' };
    }
    await logWithClient(client, {
        action: 'document.update',
        resource_type: 'member_document',
        resource_id: docId,
        details: { name, description }
    });
    await client.query('COMMIT');
    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`Error updating document ${docId}:`, error);
    return { error: 'Failed to update document.' };
  } finally {
      client.release();
  }
}

export async function deleteDocumentAction(docId: string): Promise<{ success: boolean; error?: string }> {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query('DELETE FROM member_documents WHERE id = $1', [docId]);
    if (result.rowCount === 0) {
      return { success: false, error: 'Document not found.' };
    }
    await logWithClient(client, {
        action: 'document.delete',
        resource_type: 'member_document',
        resource_id: docId,
    });
    await client.query('COMMIT');
    return { success: true };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`Error deleting document ${docId}:`, error);
    return { success: false, error: 'Failed to delete document.' };
  } finally {
      client.release();
  }
}


export async function addCourseOrCertificateAction(data: Omit<CourseOrCertificate, 'id' | 'created_at'>): Promise<CourseOrCertificate | { error: string }> {
  const { member_id, type, name, provider, course_url, status, verification_url, certificate_url, certificate_file_type } = data;
   const client = await db.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query(
      `INSERT INTO member_courses_certificates (member_id, type, name, provider, course_url, status, verification_url, certificate_url, certificate_file_type)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *;`,
      [member_id, type, name, provider || null, course_url || null, status || null, verification_url || null, certificate_url || null, certificate_file_type || null]
    );
    const newRecord = result.rows[0];
    await logWithClient(client, {
        action: 'course_or_cert.create',
        resource_type: 'course_or_cert',
        resource_id: newRecord.id,
        details: { name, type, member_id }
    });
    await client.query('COMMIT');
    return newRecord;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error adding course or certificate:', error);
    return { error: 'Failed to add course or certificate.' };
  } finally {
      client.release();
  }
}

export async function getCoursesAndCertificatesAction(memberId: string): Promise<CourseOrCertificate[]> {
  await setupDatabase();
  try {
    const result = await db.query('SELECT * FROM member_courses_certificates WHERE member_id = $1 ORDER BY created_at DESC', [memberId]);
    return result.rows;
  } catch (error) {
    console.error(`Error fetching courses/certificates for member ${memberId}:`, error);
    return [];
  }
}

export async function getAssessmentCategoriesAction(): Promise<AssessmentCategory[]> {
    await setupDatabase();
    try {
        const result = await db.query('SELECT * FROM assessment_categories ORDER BY name ASC');
        return result.rows;
    } catch (error) {
        console.error('Error fetching assessment categories:', error);
        return [];
    }
}

export async function addAssessmentCategoryAction(name: string): Promise<AssessmentCategory | { error: string }> {
    await setupDatabase();
    const client = await db.connect();
    try {
        await client.query('BEGIN');
        const result = await client.query('INSERT INTO assessment_categories (name) VALUES ($1) RETURNING *', [name]);
        const newCategory = result.rows[0];
        await logWithClient(client, {
            action: 'assessment_category.create',
            resource_type: 'assessment_category',
            resource_id: newCategory.id,
            details: { name }
        });
        await client.query('COMMIT');
        return newCategory;
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error adding assessment category:', error);
        return { error: 'Failed to add category. It may already exist.' };
    } finally {
        client.release();
    }
}

export async function deleteAssessmentCategoryAction(id: string): Promise<{ success: boolean; error?: string }> {
    await setupDatabase();
     const client = await db.connect();
    try {
        await client.query('BEGIN');
        const result = await client.query('DELETE FROM assessment_categories WHERE id = $1', [id]);
        if (result.rowCount === 0) {
            return { success: false, error: 'Category not found.' };
        }
         await logWithClient(client, {
            action: 'assessment_category.delete',
            resource_type: 'assessment_category',
            resource_id: id,
        });
        await client.query('COMMIT');
        return { success: true };
    } catch (error) {
        await client.query('ROLLBACK');
        console.error(`Error deleting category ${id}:`, error);
        return { success: false, error: 'Failed to delete category.' };
    } finally {
        client.release();
    }
}

export async function updateMemberStatusAction(id: string, status: Member['status']): Promise<{ success: boolean }> {
    const client = await db.connect();
    try {
        await client.query('BEGIN');
        await client.query('UPDATE members SET status = $1, updated_at = NOW() WHERE id = $2', [status, id]);
        await logWithClient(client, {
            action: 'staff.update_status',
            resource_type: 'member',
            resource_id: id,
            details: { status }
        });
        await client.query('COMMIT');
        return { success: true };
    } catch (error) {
        await client.query('ROLLBACK');
        console.error(`Error updating status for member with id ${id}:`, error);
        return { success: false };
    } finally {
        client.release();
    }
}

export async function getRolesAction(): Promise<Role[]> {
    try {
        const result = await db.query('SELECT * FROM roles ORDER BY name ASC');
        return result.rows;
    } catch (error) {
        console.error('Error fetching roles:', error);
        return [];
    }
}

export async function updateMemberRoleAction(memberId: string, roleId: string): Promise<{ success: boolean; error?: string }> {
    const client = await db.connect();
    try {
        await client.query('BEGIN');
        await client.query('DELETE FROM role_members WHERE member_id = $1', [memberId]);
        const result = await client.query('INSERT INTO role_members (member_id, role_id) VALUES ($1, $2)', [memberId, roleId]);
        if (result.rowCount === 0) {
            throw new Error('Failed to assign role.');
        }
        await logWithClient(client, {
            action: 'staff.assign_role',
            resource_type: 'member',
            resource_id: memberId,
            details: { role_id: roleId }
        });
        await client.query('COMMIT');
        return { success: true };
    } catch (error) {
        await client.query('ROLLBACK');
        console.error(`Error updating role for member with id ${memberId}:`, error);
        return { success: false, error: 'Failed to update member role.' };
    } finally {
        client.release();
    }
}
