
'use server';

import {
  parseResumeToAutofillProfile,
  ParseResumeToAutofillProfileInput,
  ParseResumeToAutofillProfileOutput,
} from '@/ai/flows/resume-parsing-to-autofill-profile';
import { db, setupDatabase } from '@/lib/db';
import { Member, Note, PerformanceRecord, SelfEvaluation } from '@/lib/mock-data';

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

export async function addStaffAction(staffData: Omit<Member, 'id' | 'status' | 'profile_picture_url' | 'cover_photo_url'>): Promise<Member | { error: string }> {
  await setupDatabase();
  const { name, email, phone, domain, country, branch, experience, education, skills, job_title, date_of_birth, start_date, address, emergency_contact_name, emergency_contact_phone } = staffData;
  try {
    const result = await db.query(
      `INSERT INTO members (name, email, phone, domain, country, branch, experience, education, skills, status, job_title, date_of_birth, start_date, address, emergency_contact_name, emergency_contact_phone)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending', $10, $11, $12, $13, $14, $15)
       RETURNING *;`,
      [name, email, phone, domain, country, branch, JSON.stringify(experience), JSON.stringify(education), JSON.stringify(skills), job_title, date_of_birth, start_date, address, emergency_contact_name, emergency_contact_phone]
    );
    return result.rows[0];
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
    const { name, email, phone, domain, country, branch, experience, education, skills, status, profile_picture_url, cover_photo_url, job_title, date_of_birth, start_date, address, emergency_contact_name, emergency_contact_phone } = data;
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

export async function deleteMemberAction(id: string): Promise<{ success: boolean }> {
    try {
        await db.query('DELETE FROM members WHERE id = $1', [id]);
        return { success: true };
    } catch (error) {
        console.error(`Error deleting member with id ${id}:`, error);
        return { success: false };
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
  const { member_id, evaluation_date, self_rating, comments, tags, attachments } = data;
  try {
    const result = await db.query(
      `INSERT INTO self_evaluations (member_id, evaluation_date, self_rating, comments, tags, attachments)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *;`,
      [member_id, evaluation_date, self_rating, comments, tags, JSON.stringify(attachments)]
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
