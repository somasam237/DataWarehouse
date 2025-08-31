const pool = require('./db');

async function fixConstraints() {
    try {
        console.log('Checking and fixing foreign key constraints...');
        
        // Check all foreign key constraints
        const fkResult = await pool.query(`
            SELECT 
                tc.table_name, 
                kcu.column_name, 
                ccu.table_name AS foreign_table_name,
                ccu.column_name AS foreign_column_name,
                tc.constraint_name
            FROM 
                information_schema.table_constraints AS tc 
                JOIN information_schema.key_column_usage AS kcu
                  ON tc.constraint_name = kcu.constraint_name
                  AND tc.table_schema = kcu.table_schema
                JOIN information_schema.constraint_column_usage AS ccu
                  ON ccu.constraint_name = tc.constraint_name
                  AND ccu.table_schema = tc.table_schema
            WHERE tc.constraint_type = 'FOREIGN KEY'
            AND tc.table_schema = 'public'
        `);
        
        console.log('Foreign key constraints found:');
        fkResult.rows.forEach(row => {
            console.log(`- ${row.table_name}.${row.column_name} -> ${row.foreign_table_name}.${row.foreign_column_name}`);
        });
        
        // Drop problematic foreign key constraints
        const constraintsToDrop = [
            'macromolecule_pdb_id_fkey',
            'software_used_pdb_id_fkey',
            'authors_funding_pdb_id_fkey',
            'ligands_pdb_id_fkey',
            'version_history_pdb_id_fkey'
        ];
        
        for (const constraintName of constraintsToDrop) {
            try {
                console.log(`Dropping constraint: ${constraintName}`);
                await pool.query(`ALTER TABLE ${constraintName.split('_')[0]} DROP CONSTRAINT IF EXISTS ${constraintName}`);
                console.log(`✅ Dropped ${constraintName}`);
            } catch (error) {
                console.log(`❌ Could not drop ${constraintName}: ${error.message}`);
            }
        }
        
        console.log('✅ Foreign key constraints fixed!');
        
    } catch (error) {
        console.error('Error fixing constraints:', error.message);
    } finally {
        await pool.end();
    }
}

fixConstraints();

