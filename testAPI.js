const pool = require('./db');

async function testProteinInfoDirectly() {
    try {
        console.log('Testing direct protein_info query...');
        
        // Test basic select
        const result = await pool.query('SELECT * FROM protein_info LIMIT 2');
        console.log('✅ Direct query works. Found', result.rows.length, 'records');
        
        if (result.rows.length > 0) {
            console.log('Sample record keys:', Object.keys(result.rows[0]));
            console.log('First record PDB ID:', result.rows[0].pdb_id);
        }
        
        // Test the ProteinInfoModel
        console.log('\n🧪 Testing ProteinInfoModel...');
        const ProteinInfoModel = require('./models/ProteinInfoModel');
        const model = new ProteinInfoModel();
        
        const proteins = await model.readAll({ limit: 2, offset: 0 });
        console.log('✅ ProteinInfoModel works. Found', proteins.length, 'records');
        
        // Test the controller
        console.log('\n🎮 Testing ProteinInfoController...');
        const ProteinInfoController = require('./controllers/ProteinInfoController');
        const controller = new ProteinInfoController();
        
        // Mock request and response objects
        const mockReq = { query: { limit: 2, offset: 0 } };
        const mockRes = {
            json: (data) => {
                console.log('✅ Controller response:', data.length, 'records returned');
                return data;
            },
            status: (code) => ({
                json: (data) => {
                    console.log('❌ Controller error:', code, data);
                    return data;
                }
            })
        };
        
        await controller.getAllProteins(mockReq, mockRes);
        
    } catch (err) {
        console.error('❌ Test failed:', err.message);
        console.error('Stack:', err.stack);
    } finally {
        await pool.end();
    }
}

testProteinInfoDirectly();
