
'use server';

import {
  parseResumeToAutofillProfile,
  ParseResumeToAutofillProfileInput,
  ParseResumeToAutofillProfileOutput,
} from '@/ai/flows/resume-parsing-to-autofill-profile';
import { db, setupDatabase } from '@/lib/db';
import { Member } from '@/lib/mock-data';

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

export async function addStaffAction(staffData: Omit<Member, 'id' | 'status'>): Promise<Member | { error: string }> {
  await setupDatabase();
  const { name, email, phone, domain, country, branch, experience, education, skills } = staffData;
  try {
    const result = await db.query(
      `INSERT INTO members (name, email, phone, domain, country, branch, experience, education, skills, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending')
       RETURNING *;`,
      [name, email, phone, domain, country, branch, JSON.stringify(experience), JSON.stringify(education), JSON.stringify(skills)]
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

export async function updateMemberAction(id: string, data: Partial<Member>): Promise<Member | { error: string }> {
    const { name, email, phone, domain, country, branch, experience, education, skills, status, profile_picture_url } = data;
    try {
        // Build the update query dynamically to avoid updating all fields
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
        
        if (fields.length === 0) {
            return { error: "No fields to update." };
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
