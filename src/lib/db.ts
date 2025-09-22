
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
                domain VARCHAR(100) NOT NULL,
                country VARCHAR(100) NOT NULL,
                branch VARCHAR(100) NOT NULL,
                status VARCHAR(50) NOT NULL DEFAULT 'pending',
                experience JSONB,
                education JSONB,
                skills JSONB,
                profile_picture BYTEA,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
        `);
        console.log('`members` table is ready.');
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
