const pool = require('./db');

async function testDatabase() {
    try {
        console.log('Testing database connection...');
        
        // Test connection
        const connectionTest = await pool.query('SELECT NOW()');
        console.log('✅ Database connected successfully at:', connectionTest.rows[0].now);
        
        // Check tables
        const tablesResult = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `);
        
        console.log('\n📊 Tables in database:');
        tablesResult.rows.forEach(row => {
            console.log('  - ' + row.table_name);
        });
        
        // Test protein_info table structure
        try {
            console.log('\n🔍 Checking protein_info table structure:');
            const columnsResult = await pool.query(`
                SELECT column_name, data_type, is_nullable 
                FROM information_schema.columns 
                WHERE table_name = 'protein_info' AND table_schema = 'public'
                ORDER BY ordinal_position
            `);
            
            columnsResult.rows.forEach(col => {
                console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
            });
            
            // Check sample data
            const sampleData = await pool.query('SELECT * FROM protein_info LIMIT 1');
            console.log('\n📋 Sample protein_info record count:', sampleData.rows.length);
            if (sampleData.rows.length > 0) {
                console.log('Sample columns:', Object.keys(sampleData.rows[0]));
            }
            
        } catch (err) {
            console.log('❌ protein_info table issues:', err.message);
        }
        
        // Test entries table specifically  
        try {
            const entriesTest = await pool.query('SELECT COUNT(*) FROM entries');
            console.log(`\n📈 Entries table has ${entriesTest.rows[0].count} records`);
        } catch (err) {
            console.log('\n❌ Entries table not found:', err.message);
        }
        
    } catch (err) {
        console.error('❌ Database test failed:', err.message);
    } finally {
        await pool.end();
    }
}

testDatabase();
