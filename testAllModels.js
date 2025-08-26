// Comprehensive test script for all new models and endpoints
const ProteinInfoModel = require('./models/ProteinInfoModel');
const AuthorsFundingModel = require('./models/AuthorsFundingModel');
const ExperimentalDataModel = require('./models/ExperimentalDataModel');
const MacromoleculeModel = require('./models/MacromoleculeModel');
const LigandsModel = require('./models/LigandsModel');
const SoftwareUsedModel = require('./models/SoftwareUsedModel');
const VersionHistoryModel = require('./models/VersionHistoryModel');

async function testAllModels() {
    console.log('='.repeat(60));
    console.log('TESTING ALL NEW MODELS WITH ACTUAL DATABASE SCHEMA');
    console.log('='.repeat(60));

    const models = [
        { name: 'ProteinInfoModel', model: new ProteinInfoModel() },
        { name: 'AuthorsFundingModel', model: new AuthorsFundingModel() },
        { name: 'ExperimentalDataModel', model: new ExperimentalDataModel() },
        { name: 'MacromoleculeModel', model: new MacromoleculeModel() },
        { name: 'LigandsModel', model: new LigandsModel() },
        { name: 'SoftwareUsedModel', model: new SoftwareUsedModel() },
        { name: 'VersionHistoryModel', model: new VersionHistoryModel() }
    ];

    for (const { name, model } of models) {
        console.log(`\n--- Testing ${name} ---`);
        try {
            // Test basic readAll functionality
            const data = await model.readAll({ limit: 2 });
            console.log(`✅ ${name}.readAll(): Retrieved ${data.length} records`);
            
            if (data.length > 0) {
                console.log(`   Sample record keys: ${Object.keys(data[0]).join(', ')}`);
                
                // Test statistics method if available
                if (typeof model.getStatistics === 'function') {
                    const stats = await model.getStatistics();
                    console.log(`✅ ${name}.getStatistics(): Success`);
                } else if (typeof model.getMacromoleculeStatistics === 'function') {
                    const stats = await model.getMacromoleculeStatistics();
                    console.log(`✅ ${name}.getMacromoleculeStatistics(): Success`);
                } else if (typeof model.getLigandStatistics === 'function') {
                    const stats = await model.getLigandStatistics();
                    console.log(`✅ ${name}.getLigandStatistics(): Success`);
                } else if (typeof model.getVersionStatistics === 'function') {
                    const stats = await model.getVersionStatistics();
                    console.log(`✅ ${name}.getVersionStatistics(): Success`);
                } else if (typeof model.getAuthorsFundingStatistics === 'function') {
                    const stats = await model.getAuthorsFundingStatistics();
                    console.log(`✅ ${name}.getAuthorsFundingStatistics(): Success`);
                } else if (typeof model.getExperimentalStatistics === 'function') {
                    const stats = await model.getExperimentalStatistics();
                    console.log(`✅ ${name}.getExperimentalStatistics(): Success`);
                } else if (typeof model.getSoftwareStatistics === 'function') {
                    const stats = await model.getSoftwareStatistics();
                    console.log(`✅ ${name}.getSoftwareStatistics(): Success`);
                }
            }
            
        } catch (error) {
            console.log(`❌ ${name} failed: ${error.message}`);
        }
    }

    console.log('\n' + '='.repeat(60));
    console.log('MODEL TESTING COMPLETE');
    console.log('='.repeat(60));
    process.exit(0);
}

testAllModels().catch(error => {
    console.error('Test script error:', error);
    process.exit(1);
});
