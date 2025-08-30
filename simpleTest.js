const http = require('http');

function testServer() {
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/health',
    method: 'GET'
  };

  const req = http.request(options, (res) => {
    console.log('Server response status:', res.statusCode);
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('Server response:', data);
    });
  });

  req.on('error', (err) => {
    console.error('Error connecting to server:', err.message);
  });

  req.end();
}

console.log('Testing server connection...');
testServer(); 