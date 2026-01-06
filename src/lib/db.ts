

import { Pool } from 'pg';
import 'dotenv/config';
import { ALL_PERMISSIONS } from './permissions';

let pool: Pool;

try {
  if (!process.env.POSTGRES_USER || !process.env.POSTGRES_PASSWORD || !process.env.POSTGRES_HOST || !process.env.POSTGRES_PORT || !process.env.POSTGRES_DATABASE || !process.env.POSTGRES_CA) {
    throw new Error('One or more PostgreSQL environment variables are not set.');
  }

  pool = new Pool({
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    host: process.env.POSTGRES_HOST,
    port: parseInt(process.env.POSTGRES_PORT, 10),
    database: process.env.POSTGRES_DATABASE,
    ssl: {
      rejectUnauthorized: true,
      ca: process.env.POSTGRES_CA.replace(/\\n/g, '\n'),
    },
  });

} catch (error) {
  console.error('Failed to create database connection pool:', error);
  pool = new Proxy({} as Pool, {
    get(target, prop) {
      if (prop === 'query') {
        return async () => {
          console.error('Database is not connected. Returning empty result.');
          return { rows: [], rowCount: 0, command: '', oid: 0, fields: [] };
        };
      }
      return Reflect.get(target, prop);
    }
  });
}

export const db = pool;

export async function setupDatabase() {
    let client;
    try {
        client = await db.connect();
        
        await client.query(`
            CREATE TABLE IF NOT EXISTS members (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                first_name VARCHAR(255),
                middle_name VARCHAR(255),
                last_name VARCHAR(255),
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                domain VARCHAR(100),
                country VARCHAR(100),
                branch VARCHAR(100),
                status VARCHAR(50) NOT NULL DEFAULT 'pending',
                experience JSONB,
                education JSONB,
                skills JSONB,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                password TEXT,
                profile_picture_url VARCHAR(2048),
                cover_photo_url VARCHAR(2048),
                job_title VARCHAR(255),
                date_of_birth DATE,
                start_date DATE,
                address TEXT,
                emergency_contact_name VARCHAR(255),
                emergency_contact_phone VARCHAR(50),
                hobbies JSONB,
                volunteer_work JSONB,
                gender VARCHAR(50),
                phone VARCHAR(50),
                street_address VARCHAR(255),
                city VARCHAR(100),
                state_province VARCHAR(100),
                postal_code VARCHAR(20),
                emergency_contact_relationship VARCHAR(100),
                citizenship VARCHAR(100),
                national_id VARCHAR(100),
                passport_no VARCHAR(100),
                visa_work_permit VARCHAR(100),
                visa_work_permit_expiry DATE,
                employee_id VARCHAR(100) UNIQUE,
                employment_type VARCHAR(50),
                employee_level VARCHAR(50),
                reporting_supervisor_id UUID,
                reporting_supervisor_history JSONB
            );
        `);
        
        await client.query(`
            CREATE TABLE IF NOT EXISTS roles (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name VARCHAR(255) UNIQUE NOT NULL,
                description TEXT,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
        `);

        await client.query(`
             CREATE TABLE IF NOT EXISTS permissions (
                id VARCHAR(255) PRIMARY KEY,
                description TEXT,
                resource VARCHAR(100)
            );
        `);
        
        await client.query(`
            CREATE TABLE IF NOT EXISTS role_members (
                role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
                member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
                PRIMARY KEY (role_id, member_id)
            );
        `);

        await client.query(`
             CREATE TABLE IF NOT EXISTS role_permissions (
                role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
                permission_id VARCHAR(255) NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
                PRIMARY KEY (role_id, permission_id)
            );
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS member_notes (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
                created_by_id VARCHAR(255) NOT NULL,
                created_by_name VARCHAR(255) NOT NULL,
                note_name VARCHAR(255) NOT NULL,
                description TEXT NOT NULL,
                is_confidential BOOLEAN DEFAULT false,
                attachments JSONB,
                tags TEXT[],
                pinned BOOLEAN DEFAULT false,
                mentions TEXT,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS performance_records (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
                reviewer_id VARCHAR(255) NOT NULL,
                reviewer_name VARCHAR(255) NOT NULL,
                review_date DATE NOT NULL,
                score INTEGER,
                comments TEXT,
                tags TEXT[],
                attachments JSONB,
                is_confidential BOOLEAN DEFAULT false,
                pinned BOOLEAN DEFAULT false,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS self_evaluations (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
                evaluation_date DATE NOT NULL,
                self_rating INTEGER,
                comments JSONB,
                other_comments TEXT,
                tags TEXT[],
                attachments JSONB,
                status VARCHAR(50) NOT NULL DEFAULT 'Pending',
                hr_feedback TEXT,
                finalized_by_id VARCHAR(255),
                finalized_by_name VARCHAR(255),
                finalized_at TIMESTAMPTZ,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS password_resets (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                email VARCHAR(255) NOT NULL,
                token TEXT NOT NULL,
                otp VARCHAR(6) NOT NULL,
                expires_at TIMESTAMPTZ NOT NULL,
                type VARCHAR(20) NOT NULL DEFAULT 'reset',
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS member_documents (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                file_url VARCHAR(2048) NOT NULL,
                file_type VARCHAR(100),
                file_size BIGINT,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
        `);

         await client.query(`
            CREATE TABLE IF NOT EXISTS member_courses_certificates (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
                type VARCHAR(50) NOT NULL,
                name VARCHAR(255) NOT NULL,
                provider VARCHAR(255),
                course_url VARCHAR(2048),
                status VARCHAR(50),
                verification_url VARCHAR(2048),
                certificate_url VARCHAR(2048),
                certificate_file_type VARCHAR(100),
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS workfeed_posts (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                author_id VARCHAR(255) NOT NULL,
                author_name VARCHAR(255) NOT NULL,
                author_role VARCHAR(100),
                author_avatar_url VARCHAR(2048),
                content TEXT NOT NULL,
                image_url VARCHAR(2048),
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS workfeed_likes (
                post_id UUID NOT NULL REFERENCES workfeed_posts(id) ON DELETE CASCADE,
                user_id VARCHAR(255) NOT NULL,
                PRIMARY KEY (post_id, user_id)
            );
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS workfeed_comments (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                post_id UUID NOT NULL REFERENCES workfeed_posts(id) ON DELETE CASCADE,
                parent_comment_id UUID REFERENCES workfeed_comments(id) ON DELETE CASCADE,
                author_id VARCHAR(255) NOT NULL,
                author_name VARCHAR(255) NOT NULL,
                author_avatar_url VARCHAR(2048),
                content TEXT NOT NULL,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS workfeed_comment_likes (
                comment_id UUID NOT NULL REFERENCES workfeed_comments(id) ON DELETE CASCADE,
                user_id VARCHAR(255) NOT NULL,
                PRIMARY KEY (comment_id, user_id)
            );
        `);
        
        await client.query(`
            CREATE TABLE IF NOT EXISTS app_settings (
                key VARCHAR(255) PRIMARY KEY,
                value JSONB NOT NULL
            );
        `);
        
        await client.query(`
            CREATE TABLE IF NOT EXISTS assessment_categories (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name VARCHAR(255) UNIQUE NOT NULL,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
        `);
        
        await client.query(`
            CREATE TABLE IF NOT EXISTS leave_categories (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name VARCHAR(100) UNIQUE NOT NULL,
                description TEXT,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS leave_entitlements (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
                category_id UUID NOT NULL REFERENCES leave_categories(id) ON DELETE CASCADE,
                year INTEGER NOT NULL,
                days REAL NOT NULL,
                UNIQUE(member_id, category_id, year)
            );
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS leave_requests (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
                category_id UUID NOT NULL REFERENCES leave_categories(id) ON DELETE CASCADE,
                start_date DATE NOT NULL,
                end_date DATE NOT NULL,
                days REAL NOT NULL,
                reason TEXT,
                project VARCHAR(255),
                project_lead VARCHAR(255),
                direct_report VARCHAR(255),
                status VARCHAR(50) NOT NULL DEFAULT 'Pending',
                approved_by_id UUID,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS audit_logs (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                actor_id VARCHAR(255),
                actor_name VARCHAR(255),
                action VARCHAR(255) NOT NULL,
                resource_type VARCHAR(100),
                resource_id VARCHAR(255),
                details JSONB,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
        `);
        
        // Seed default roles
        const { rows: roleCount } = await client.query('SELECT COUNT(*) FROM roles');
        if (parseInt(roleCount[0].count, 10) === 0) {
            const defaultRoles = [
                { name: 'Super Admin', description: 'Has all permissions.' },
                { name: 'HR Admin', description: 'Manages HR functions, roles, and staff.' },
                { name: 'HR Staff', description: 'Assists with HR tasks.' },
                { name: 'Manager', description: 'Manages a team of employees.' },
                { name: 'Employee', description: 'Standard employee access.' },
                { name: 'Document Controller', description: 'Manages company documents.' },
            ];
            for (const role of defaultRoles) {
                await client.query('INSERT INTO roles (name, description) VALUES ($1, $2)', [role.name, role.description]);
            }
        }
        
         // Seed permissions
        const { rows: permCount } = await client.query('SELECT COUNT(*) FROM permissions');
        if (parseInt(permCount[0].count, 10) === 0) {
            for (const perm of ALL_PERMISSIONS) {
                await client.query(
                    'INSERT INTO permissions (id, description, resource) VALUES ($1, $2, $3)',
                    [perm.id, perm.description, perm.resource]
                );
            }
        }

        // Seed default assessment categories if they don't exist
        const { rows: categoryCount } = await client.query('SELECT COUNT(*) FROM assessment_categories');
        if (parseInt(categoryCount[0].count, 10) === 0) {
            const defaultCategories = [
                'Technical Skills',
                'Soft Skills',
                'Problem-Solving',
                'Productivity & Time Management',
                'Learning & Development',
            ];
            for (const categoryName of defaultCategories) {
                await client.query('INSERT INTO assessment_categories (name) VALUES ($1)', [categoryName]);
            }
        }
        
         // Seed default leave categories if they don't exist
        const { rows: leaveCategoryCount } = await client.query('SELECT COUNT(*) FROM leave_categories');
        if (parseInt(leaveCategoryCount[0].count, 10) === 0) {
            const defaultLeaveCategories = [
                { name: 'Vacation', description: 'Paid time off for rest and relaxation.' },
                { name: 'Sick', description: 'Paid time off for illness or injury.' },
                { name: 'Bereavement', description: 'Paid time off to grieve the loss of a loved one.' },
                { name: 'Personal', description: 'Paid time off for personal matters.' },
            ];
            for (const category of defaultLeaveCategories) {
                await client.query('INSERT INTO leave_categories (name, description) VALUES ($1, $2)', [category.name, category.description]);
            }
        }

        const { rows: firstNameCheck } = await client.query(`
            SELECT 1 FROM information_schema.columns 
            WHERE table_name='members' AND column_name='first_name';
        `);

        if (firstNameCheck.length > 0) {
            await client.query(`
                UPDATE members
                SET first_name = COALESCE(SPLIT_PART(name, ' ', 1), ''),
                    last_name = COALESCE(SUBSTRING(name from ' .*$'), '')
                WHERE first_name IS NULL OR last_name IS NULL;
            `);
        }
        
    } catch (err) {
        console.error('Error setting up the database table:', err);
        throw err;
    } finally {
        if (client) {
            client.release();
        }
    }
}
