const pool = require('./db');

async function removeConstraints() {
    try {
        console.log('Removing foreign key constraints...');

        const constraints = [
            'authors_funding_pdb_id_fkey',
            'experimental_data_pdb_id_fkey',
            'software_used_pdb_id_fkey',
            'version_history_pdb_id_fkey'
        ];

        // Map constraint names to table names
        const tableMap = {
            'authors_funding_pdb_id_fkey': 'authors_funding',
            'experimental_data_pdb_id_fkey': 'experimental_data',
            'software_used_pdb_id_fkey': 'software_used',
            'version_history_pdb_id_fkey': 'version_history'
        };

        for (const constraint of constraints) {
            try {
                const tableName = tableMap[constraint];
                await pool.query(`ALTER TABLE ${tableName} DROP CONSTRAINT IF EXISTS ${constraint}`);
                console.log(`✓ Removed constraint: ${constraint} from table ${tableName}`);
            } catch (error) {
                console.log(`⚠ Could not remove constraint ${constraint}:`, error.message);
            }
        }

        console.log('All constraints removed successfully!');
        pool.end();
    } catch (error) {
        console.error('Error removing constraints:', error);
        pool.end();
    }
}

removeConstraints();
