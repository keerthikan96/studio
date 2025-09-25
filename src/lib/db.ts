
import { Pool } from 'pg';
import 'dotenv/config';

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

  console.log('Database connection pool created successfully.');

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
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password TEXT,
                phone VARCHAR(50),
                domain VARCHAR(100),
                country VARCHAR(100),
                branch VARCHAR(100),
                status VARCHAR(50) NOT NULL DEFAULT 'pending',
                experience JSONB,
                education JSONB,
                skills JSONB,
                profile_picture_url VARCHAR(2048),
                cover_photo_url VARCHAR(2048),
                job_title VARCHAR(255),
                date_of_birth DATE,
                start_date DATE,
                address TEXT,
                emergency_contact_name VARCHAR(255),
                emergency_contact_phone VARCHAR(50),
                hobbies TEXT,
                volunteer_work TEXT,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
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
            console.log('Default assessment categories have been seeded.');
        }

        const member_columns = [
            { name: 'password', type: 'TEXT' },
            { name: 'profile_picture_url', type: 'VARCHAR(2048)' },
            { name: 'cover_photo_url', type: 'VARCHAR(2048)' },
            { name: 'job_title', type: 'VARCHAR(255)' },
            { name: 'date_of_birth', type: 'DATE' },
            { name: 'start_date', type: 'DATE' },
            { name: 'address', type: 'TEXT' },
            { name: 'emergency_contact_name', type: 'VARCHAR(255)' },
            { name: 'emergency_contact_phone', type: 'VARCHAR(50)' },
            { name: 'hobbies', type: 'TEXT' },
            { name: 'volunteer_work', type: 'TEXT' },
        ];

        for (const col of member_columns) {
            const { rows } = await client.query(`
                SELECT column_name
                FROM information_schema.columns
                WHERE table_name='members' AND column_name=$1;
            `, [col.name]);
            if (rows.length === 0) {
                await client.query(`ALTER TABLE members ADD COLUMN ${col.name} ${col.type};`);
            }
        }

        const note_columns = [
            { name: 'tags', type: 'TEXT[]' },
            { name: 'pinned', type: 'BOOLEAN DEFAULT false' },
            { name: 'mentions', type: 'TEXT' },
        ];

        for (const col of note_columns) {
             const { rows } = await client.query(`
                SELECT column_name
                FROM information_schema.columns
                WHERE table_name='member_notes' AND column_name=$1;
            `, [col.name]);
            if (rows.length === 0) {
                await client.query(`ALTER TABLE member_notes ADD COLUMN ${col.name} ${col.type};`);
            }
        }

        const { rows: resetColumns } = await client.query(`
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name='password_resets' AND column_name='type';
        `);
        if (resetColumns.length === 0) {
            await client.query(`ALTER TABLE password_resets ADD COLUMN type VARCHAR(20) NOT NULL DEFAULT 'reset';`);
        }
        
        const { rows: commentColumns } = await client.query(`
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name='workfeed_comments' AND column_name='parent_comment_id';
        `);
        if (commentColumns.length === 0) {
            await client.query(`ALTER TABLE workfeed_comments ADD COLUMN parent_comment_id UUID REFERENCES workfeed_comments(id) ON DELETE CASCADE;`);
        }

        const { rows: selfEvalColumns } = await client.query(`
            SELECT column_name FROM information_schema.columns 
            WHERE table_name='self_evaluations' AND column_name='comments';
        `);
        if (selfEvalColumns.length > 0) {
             const { rows: columnInfo } = await client.query(`
                SELECT data_type FROM information_schema.columns
                WHERE table_name='self_evaluations' AND column_name='comments';
             `);
             if (columnInfo[0].data_type === 'text') {
                 await client.query(`ALTER TABLE self_evaluations ALTER COLUMN comments TYPE JSONB USING to_jsonb(comments);`);
             }
        }
        
        const { rows: selfEvalOtherComments } = await client.query(`
            SELECT column_name FROM information_schema.columns
            WHERE table_name='self_evaluations' AND column_name='other_comments';
        `);
        if (selfEvalOtherComments.length === 0) {
            await client.query(`ALTER TABLE self_evaluations ADD COLUMN other_comments TEXT;`);
        }


        console.log('Database tables are ready.');
    } catch (err) {
        console.error('Error setting up the database table:', err);
        throw err;
    } finally {
        if (client) {
            client.release();
        }
    }
}
