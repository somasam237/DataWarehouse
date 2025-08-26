const pool = require('./db');

async function checkTables() {
    try {
        const result = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name;
        `);
        
        console.log('Current tables:');
        result.rows.forEach(row => console.log('- ' + row.table_name));
        
        // Check the structure of each new table
        const newTables = ['protein_info', 'authors_funding', 'experimental_data', 'macromolecule', 'ligands', 'software_used', 'version_history'];
        
        for (const tableName of newTables) {
            try {
                const columns = await pool.query(`
                    SELECT column_name, data_type, is_nullable 
                    FROM information_schema.columns 
                    WHERE table_name = $1 
                    ORDER BY ordinal_position;
                `, [tableName]);
                
                if (columns.rows.length > 0) {
                    console.log(`\n${tableName} columns:`);
                    columns.rows.forEach(col => 
                        console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`)
                    );
                }
            } catch (err) {
                console.log(`Table ${tableName} does not exist`);
            }
        }
        
        pool.end();
    } catch (error) {
        console.error('Error:', error);
        pool.end();
    }
}

checkTables();
