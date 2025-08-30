const pool = require('./db');
const fs = require('fs');
const path = require('path');

async function setupAuth() {
  try {
    console.log('Setting up authentication database...');
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'database', 'create_users_table.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Execute the SQL
    await pool.query(sql);
    
    console.log('✅ Authentication database setup completed successfully!');
    console.log('✅ Users table created with all necessary fields');
    console.log('✅ Indexes created for optimal performance');
    
  } catch (error) {
    console.error('❌ Error setting up authentication database:', error);
  } finally {
    await pool.end();
  }
}

setupAuth(); 