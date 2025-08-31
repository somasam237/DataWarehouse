const pool = require('./db');

async function checkTableStructure() {
    try {
        console.log('Checking experimental_data table structure...');
        
        // Check primary key constraints
        const pkResult = await pool.query(`
            SELECT constraint_name, constraint_type 
            FROM information_schema.table_constraints 
            WHERE table_name = 'experimental_data' AND constraint_type = 'PRIMARY KEY'
        `);
        console.log('Primary key constraints:', pkResult.rows);
        
        // Check unique constraints
        const uniqueResult = await pool.query(`
            SELECT constraint_name, constraint_type 
            FROM information_schema.table_constraints 
            WHERE table_name = 'experimental_data' AND constraint_type = 'UNIQUE'
        `);
        console.log('Unique constraints:', uniqueResult.rows);
        
        // Check if pdb_id is unique
        const pdbIdResult = await pool.query(`
            SELECT COUNT(*) as total, COUNT(DISTINCT pdb_id) as unique_count 
            FROM experimental_data
        `);
        console.log('PDB ID uniqueness check:', pdbIdResult.rows[0]);
        
        // Try to insert a duplicate pdb_id to see what happens
        console.log('\nTesting duplicate PDB ID insertion...');
        try {
            const insertResult = await pool.query(`
                INSERT INTO experimental_data (pdb_id, method, resolution_a) 
                VALUES ('1DP5', 'TEST METHOD', 1.0)
            `);
            console.log('✅ Duplicate insertion succeeded (no unique constraint)');
        } catch (error) {
            console.log('❌ Duplicate insertion failed:', error.message);
        }
        
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await pool.end();
    }
}

checkTableStructure();

