const http = require('http');

function testAPI() {
    console.log('Testing POST /api/experimental-data...');
    
    const testData = {
        pdb_id: 'TEST999',
        method: 'X-RAY DIFFRACTION',
        resolution_a: 2.5
    };
    
    const postData = JSON.stringify(testData);
    
    const options = {
        hostname: 'localhost',
        port: 5000,
        path: '/api/experimental-data',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
        }
    };
    
    const req = http.request(options, (res) => {
        console.log(`Status: ${res.statusCode}`);
        console.log(`Headers: ${JSON.stringify(res.headers)}`);
        
        let data = '';
        res.on('data', (chunk) => {
            data += chunk;
        });
        
        res.on('end', () => {
            try {
                const responseData = JSON.parse(data);
                console.log('✅ Success! Response:', responseData);
            } catch (e) {
                console.log('Raw response:', data);
            }
        });
    });
    
    req.on('error', (error) => {
        console.error('❌ Error:', error.message);
    });
    
    req.write(postData);
    req.end();
}

testAPI();
