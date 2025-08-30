const fetch = require('node-fetch');

async function testRegistration() {
  try {
    console.log('Testing registration endpoint...');
    
    const testUser = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'testpassword123'
    };
    
    const response = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testUser)
    });
    
    const data = await response.json();
    
    console.log('Response status:', response.status);
    console.log('Response data:', data);
    
    if (response.ok) {
      console.log('✅ Registration test successful');
    } else {
      console.log('❌ Registration test failed');
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Wait a bit for server to start, then test
setTimeout(testRegistration, 2000); 