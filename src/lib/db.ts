
import { Pool } from 'pg';

// This pool will be used for all our database queries
let pool: Pool;

try {
  // Check if the environment variable is set
  if (!process.env.POSTGRES_URL) {
    throw new Error('POSTGRES_URL environment variable is not set.');
  }

  // Initialize the connection pool
  pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
    // Note: In production, you'll want to configure SSL
    // ssl: {
    //   rejectUnauthorized: false, 
    // },
  });

  console.log('Database connection pool created successfully.');

} catch (error) {
  console.error('Failed to create database connection pool:', error);
  // If the pool fails to initialize, we'll assign a mock pool
  // to prevent the app from crashing during development if the DB is not available.
  // This is a simplistic fallback. In a real app, you might handle this more gracefully.
  pool = new Proxy({} as Pool, {
    get(target, prop) {
      if (prop === 'query') {
        return async () => {
          console.error('Database is not connected. Returning empty result.');
          return { rows: [], rowCount: 0 };
        };
      }
      return Reflect.get(target, prop);
    }
  });
}

export const db = pool;

// A function to create the members table if it doesn't exist
export async function setupDatabase() {
    const client = await db.connect();
    try {
        await client.query(`
            CREATE TABLE IF NOT EXISTS members (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                phone VARCHAR(50),
                domain VARCHAR(100) NOT NULL,
                country VARCHAR(100) NOT NULL,
                branch VARCHAR(100) NOT NULL,
                status VARCHAR(50) NOT NULL DEFAULT 'pending',
                experience JSONB,
                education JSONB,
                skills JSONB,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTamPTZ NOT NULL DEFAULT NOW()
            );
        `);
        console.log('`members` table is ready.');
    } catch (err) {
        console.error('Error setting up the database table:', err);
    } finally {
        client.release();
    }
}
