
import { Pool } from 'pg';
import 'dotenv/config';

// This pool will be used for all our database queries
let pool: Pool;

try {
  // Check if the essential environment variables are set
  if (!process.env.POSTGRES_USER || !process.env.POSTGRES_PASSWORD || !process.env.POSTGRES_HOST || !process.env.POSTGRES_PORT || !process.env.POSTGRES_DATABASE || !process.env.POSTGRES_CA) {
    throw new Error('One or more PostgreSQL environment variables are not set.');
  }

  // Initialize the connection pool using detailed configuration
  pool = new Pool({
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    host: process.env.POSTGRES_HOST,
    port: parseInt(process.env.POSTGRES_PORT, 10),
    database: process.env.POSTGRES_DATABASE,
    ssl: {
      rejectUnauthorized: true,
      // The `ca` certificate is passed directly as a string.
      // The certificate string from the .env file might contain escaped newlines (\n),
      // which need to be unescaped for the connection to work.
      ca: process.env.POSTGRES_CA.replace(/\\n/g, '\n'),
    },
  });

  console.log('Database connection pool created successfully.');

} catch (error) {
  console.error('Failed to create database connection pool:', error);
  // If the pool fails to initialize, we'll assign a mock pool
  // to prevent the app from crashing during development if the DB is not available.
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

// A function to create the members table if it doesn't exist
export async function setupDatabase() {
    let client;
    try {
        client = await db.connect();
        await client.query(`
            CREATE TABLE IF NOT EXISTS members (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
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
        
        // Add new columns if they don't exist for backward compatibility
        const member_columns = [
            { name: 'profile_picture_url', type: 'VARCHAR(2048)' },
            { name: 'cover_photo_url', type: 'VARCHAR(2048)' },
            { name: 'job_title', type: 'VARCHAR(255)' },
            { name: 'date_of_birth', type: 'DATE' },
            { name: 'start_date', type: 'DATE' },
            { name: 'address', type: 'TEXT' },
            { name: 'emergency_contact_name', type: 'VARCHAR(255)' },
            { name: 'emergency_contact_phone', type: 'VARCHAR(50)' },
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
        
        console.log('Database tables are ready.');
    } catch (err) {
        console.error('Error setting up the database table:', err);
        // Re-throw the error to be caught by the calling function
        throw err;
    } finally {
        if (client) {
            client.release();
        }
    }
}
