

'use server';

import {
  parseResumeToAutofillProfile,
  ParseResumeToAutofillProfileInput,
  ParseResumeToAutofillProfileOutput,
} from '@/ai/flows/resume-parsing-to-autofill-profile';
import { db, setupDatabase } from '@/lib/db';
import { Member, Note, PerformanceRecord, SelfEvaluation, Document, CourseOrCertificate, AssessmentCategory } from '@/lib/mock-data';
import { requestPasswordResetAction } from './auth';

export async function parseResumeAction(
  input: ParseResumeToAutofillProfileInput
): Promise<ParseResumeToAutofillProfileOutput | { error: string }> {
  try {
    const result = await parseResumeToAutofillProfile(input);
    return result;
  } catch (error) {
    console.error('Error parsing resume:', error);
    return { error: 'Failed to parse resume. Please check the file and try again.' };
  }
}

export async function addStaffAction(staffData: { staff: Omit<Member, 'id' | 'status' | 'profile_picture_url' | 'cover_photo_url' | 'role'>, sendInvite: boolean, resume?: { url: string, type: string, size: number } }): Promise<{ member: Member, invitationLink?: string } | { error: string }> {
  await setupDatabase();
  const { staff, sendInvite, resume } = staffData;
  const { name, email, phone, domain, country, branch, experience, education, skills, job_title, date_of_birth, start_date, address, emergency_contact_name, emergency_contact_phone, hobbies, volunteer_work } = staff;
  try {
    // Use a database transaction
    const client = await db.connect();
    try {
      await client.query('BEGIN');

      const result = await client.query(
        `INSERT INTO members (name, email, phone, domain, country, branch, experience, education, skills, status, job_title, date_of_birth, start_date, address, emergency_contact_name, emergency_contact_phone, hobbies, volunteer_work, role)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending', $10, $11, $12, $13, $14, $15, $16, $17, 'staff')
         RETURNING *;`,
        [name, email, phone, domain, country, branch, JSON.stringify(experience), JSON.stringify(education), JSON.stringify(skills), job_title, date_of_birth, start_date, address, emergency_contact_name, emergency_contact_phone, JSON.stringify(hobbies), JSON.stringify(volunteer_work)]
      );
      const newMember = result.rows[0];

      // If a resume was uploaded, add it to the documents table
      if (resume) {
        await client.query(
          `INSERT INTO member_documents (member_id, name, description, file_url, file_type, file_size)
           VALUES ($1, $2, $3, $4, $5, $6);`,
          [newMember.id, 'Resume', 'Uploaded during employee creation.', resume.url, resume.type, resume.size]
        );
      }

      let invitationLink: string | undefined = undefined;
      if (sendInvite) {
          const inviteResult = await requestPasswordResetAction(newMember.email, true);
          if (inviteResult.success && inviteResult.invitationLink) {
              invitationLink = inviteResult.invitationLink;
          } else {
              console.error("Failed to generate invitation link for new member:", inviteResult.error);
              // Decide if you want to fail the whole operation or just log the error
          }
      }

      await client.query('COMMIT');
      return { member: newMember, invitationLink };

    } catch (error) {
      await client.query('ROLLBACK');
      throw error; // Re-throw the error to be caught by the outer catch block
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error adding staff member:', error);
    return { error: 'A member with this email may already exist.' };
  }
}

export async function getMembersAction(): Promise<Member[]> {
    await setupDatabase();
    try {
        const result = await db.query('SELECT * FROM members ORDER BY created_at DESC');
        return result.rows;
    } catch (error) {
        console.error('Error fetching members:', error);
        return [];
    }
}

export async function getMemberByIdAction(id: string): Promise<Member | null> {
    try {
        const result = await db.query('SELECT * FROM members WHERE id = $1', [id]);
        if (result.rows.length === 0) return null;
        return result.rows[0];
    } catch (error) {
        console.error(`Error fetching member with id ${id}:`, error);
        return null;
    }
}

export async function updateMemberAction(id: string, data: Omit<Partial<Member>, 'id' | 'created_at' | 'updated_at'>): Promise<Member | { error: string }> {
    const { name, email, phone, domain, country, branch, experience, education, skills, status, profile_picture_url, cover_photo_url, job_title, date_of_birth, start_date, address, emergency_contact_name, emergency_contact_phone, hobbies, volunteer_work, role } = data;
    try {
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
        if (role !== undefined) { fields.push(`role = $${fieldIndex++}`); values.push(role); }
        
        if (fields.length === 0) {
            const member = await getMemberByIdAction(id);
            if (!member) return { error: "Member not found." };
            return member;
        }

        fields.push(`updated_at = NOW()`);
        values.push(id);

        const queryString = `
            UPDATE members
            SET ${fields.join(', ')}
            WHERE id = $${fieldIndex}
            RETURNING *;
        `;

        const result = await db.query(queryString, values);
        return result.rows[0];
    } catch (error) {
        console.error(`Error updating member with id ${id}:`, error);
        return { error: 'Failed to update member profile.' };
    }
}

export async function addNoteAction(data: Omit<Note, 'id' | 'created_at'>): Promise<Note | { error: string }> {
  const { member_id, created_by_id, created_by_name, note_name, description, is_confidential, attachments, tags, pinned, mentions } = data;
  try {
    const result = await db.query(
      `INSERT INTO member_notes (member_id, created_by_id, created_by_name, note_name, description, is_confidential, attachments, tags, pinned, mentions)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *;`,
      [member_id, created_by_id, created_by_name, note_name, description, is_confidential, JSON.stringify(attachments), tags, pinned, mentions]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Error adding note:', error);
    return { error: 'Failed to add note.' };
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
  try {
    const result = await db.query(
      `INSERT INTO performance_records (member_id, reviewer_id, reviewer_name, review_date, score, comments, tags, attachments, is_confidential, pinned)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *;`,
      [member_id, reviewer_id, reviewer_name, review_date, score, comments, tags, JSON.stringify(attachments), is_confidential, pinned]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Error adding performance record:', error);
    return { error: 'Failed to add performance record.' };
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
  try {
    const result = await db.query(
      `INSERT INTO self_evaluations (member_id, evaluation_date, self_rating, comments, other_comments, tags, attachments)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *;`,
      [member_id, evaluation_date, self_rating, JSON.stringify(comments), other_comments, tags, JSON.stringify(attachments)]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Error adding self-evaluation:', error);
    return { error: 'Failed to add self-evaluation record.' };
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
  try {
    const result = await db.query(
      `UPDATE self_evaluations 
       SET hr_feedback = $1, status = $2, finalized_by_id = $3, finalized_by_name = $4, finalized_at = NOW()
       WHERE id = $5
       RETURNING *;`,
      [hr_feedback, status, finalized_by_id, finalized_by_name, id]
    );
    return result.rows[0];
  } catch (error) {
    console.error(`Error updating self-evaluation with id ${id}:`, error);
    return { error: 'Failed to update self-evaluation.' };
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
  try {
    const result = await db.query(
      `INSERT INTO member_documents (member_id, name, description, file_url, file_type, file_size)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *;`,
      [member_id, name, description, file_url, file_type, file_size]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Error adding document:', error);
    return { error: 'Failed to add document.' };
  }
}

export async function updateDocumentAction(docId: string, data: { name: string, description: string }): Promise<Document | { error: string }> {
  const { name, description } = data;
  try {
    const result = await db.query(
      `UPDATE member_documents SET name = $1, description = $2 WHERE id = $3 RETURNING *;`,
      [name, description, docId]
    );
    if (result.rows.length === 0) {
      return { error: 'Document not found.' };
    }
    return result.rows[0];
  } catch (error) {
    console.error(`Error updating document ${docId}:`, error);
    return { error: 'Failed to update document.' };
  }
}

export async function deleteDocumentAction(docId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await db.query('DELETE FROM member_documents WHERE id = $1', [docId]);
    if (result.rowCount === 0) {
      return { success: false, error: 'Document not found.' };
    }
    return { success: true };
  } catch (error) {
    console.error(`Error deleting document ${docId}:`, error);
    return { success: false, error: 'Failed to delete document.' };
  }
}


export async function addCourseOrCertificateAction(data: Omit<CourseOrCertificate, 'id' | 'created_at'>): Promise<CourseOrCertificate | { error: string }> {
  const { member_id, type, name, provider, course_url, status, verification_url, certificate_url, certificate_file_type } = data;
  try {
    const result = await db.query(
      `INSERT INTO member_courses_certificates (member_id, type, name, provider, course_url, status, verification_url, certificate_url, certificate_file_type)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *;`,
      [member_id, type, name, provider || null, course_url || null, status || null, verification_url || null, certificate_url || null, certificate_file_type || null]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Error adding course or certificate:', error);
    return { error: 'Failed to add course or certificate.' };
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
    try {
        const result = await db.query('INSERT INTO assessment_categories (name) VALUES ($1) RETURNING *', [name]);
        return result.rows[0];
    } catch (error) {
        console.error('Error adding assessment category:', error);
        return { error: 'Failed to add category. It may already exist.' };
    }
}

export async function deleteAssessmentCategoryAction(id: string): Promise<{ success: boolean; error?: string }> {
    await setupDatabase();
    try {
        const result = await db.query('DELETE FROM assessment_categories WHERE id = $1', [id]);
        if (result.rowCount === 0) {
            return { success: false, error: 'Category not found.' };
        }
        return { success: true };
    } catch (error) {
        console.error(`Error deleting category ${id}:`, error);
        return { success: false, error: 'Failed to delete category.' };
    }
}

export async function updateMemberStatusAction(id: string, status: Member['status']): Promise<{ success: boolean }> {
    try {
        await db.query('UPDATE members SET status = $1, updated_at = NOW() WHERE id = $2', [status, id]);
        return { success: true };
    } catch (error) {
        console.error(`Error updating status for member with id ${id}:`, error);
        return { success: false };
    }
}

export async function updateMemberRoleAction(id: string, role: Member['role']): Promise<{ success: boolean; error?: string }> {
    try {
        const result = await db.query('UPDATE members SET role = $1, updated_at = NOW() WHERE id = $2', [role, id]);
         if (result.rowCount === 0) {
            return { success: false, error: 'Member not found.' };
        }
        return { success: true };
    } catch (error) {
        console.error(`Error updating role for member with id ${id}:`, error);
        return { success: false, error: 'Failed to update member role.' };
    }
}
