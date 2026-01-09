import { db } from '../src/lib/db';

async function addUpdatedAtColumn() {
  const client = await db.connect();
  try {
    console.log('Adding updated_at column to roles table...');
    
    // Check if column exists
    const checkColumn = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'roles' 
      AND column_name = 'updated_at'
    `);
    
    if (checkColumn.rows.length === 0) {
      // Add the column if it doesn't exist
      await client.query(`
        ALTER TABLE roles 
        ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      `);
      console.log('✓ Successfully added updated_at column to roles table');
    } else {
      console.log('✓ updated_at column already exists in roles table');
    }
  } catch (error) {
    console.error('Error adding updated_at column:', error);
    throw error;
  } finally {
    client.release();
    await db.end();
  }
}

addUpdatedAtColumn()
  .then(() => {
    console.log('Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
