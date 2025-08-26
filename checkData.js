const pool = require('./db');

async function checkData() {
    const client = await pool.connect();
    
    try {
        console.log('=== Database Status Check ===\n');
        
        // Check all tables
        const tables = ['Protein_Info', 'Authors_Funding', 'Experimental_Data', 'Macromolecule', 'Ligands', 'Software_Used', 'Version_History'];
        
        for (const table of tables) {
            const result = await client.query(`SELECT COUNT(*) FROM ${table}`);
            console.log(`${table}: ${result.rows[0].count} records`);
        }
        
        console.log('\n=== Sample Data ===');
        
        // Show some sample data from Protein_Info
        const sampleData = await client.query(`
            SELECT pdb_id, title, classification, organism, deposited_date 
            FROM Protein_Info 
            LIMIT 5
        `);
        
        console.log('\nSample Protein_Info records:');
        sampleData.rows.forEach(row => {
            console.log(`- ${row.pdb_id}: ${row.title?.substring(0, 50)}...`);
            console.log(`  Classification: ${row.classification}`);
            console.log(`  Organism: ${row.organism}`);
            console.log(`  Deposited: ${row.deposited_date}`);
            console.log('');
        });
        
    } catch (err) {
        console.error('Error checking data:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

checkData();
