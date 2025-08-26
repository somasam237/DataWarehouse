// Test script to verify models work with actual database
const ProteinInfoModel = require('./models/ProteinInfoModel');

async function testModels() {
    console.log('Testing ProteinInfoModel...');
    try {
        const proteinInfoModel = new ProteinInfoModel();
        const stats = await proteinInfoModel.getStatistics();
        console.log('Protein Info Statistics:', stats);
        
        const sampleData = await proteinInfoModel.readAll({ limit: 2 });
        console.log('Sample Protein Info Data:', sampleData);
        
        process.exit(0);
    } catch (error) {
        console.error('Error testing models:', error.message);
        process.exit(1);
    }
}

testModels();
