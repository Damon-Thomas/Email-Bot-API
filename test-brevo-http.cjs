// Direct Brevo HTTP API test - no server needed
require('dotenv').config();

const apiKey = process.env.BREVO_API_KEY;
const fromEmail = process.env.BREVO_FROM_EMAIL;
const fromName = process.env.BREVO_FROM_NAME || 'Mailer API';

console.log('Testing Brevo HTTP API directly...');
console.log('API Key:', apiKey ? `${apiKey.substring(0, 20)}...` : 'NOT SET');
console.log('From Email:', fromEmail);
console.log('From Name:', fromName);
console.log('---');

async function sendTestEmail() {
  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'api-key': apiKey,
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      sender: {
        name: fromName,
        email: fromEmail
      },
      to: [
        {
          email: 'damon.h.thomas@gmail.com',
          name: 'Damon'
        }
      ],
      subject: 'Direct Brevo API Test - ' + new Date().toLocaleTimeString(),
      textContent: 'This email was sent directly using the Brevo HTTP API. If you receive this, the API key and configuration are correct!'
    })
  });

  const data = await response.json();
  
  console.log('HTTP Status:', response.status);
  console.log('Response:', JSON.stringify(data, null, 2));
  
  if (response.ok) {
    console.log('\n✅ EMAIL SENT SUCCESSFULLY!');
    console.log('Message ID:', data.messageId);
    console.log('\nCheck your inbox at damon.h.thomas@gmail.com');
  } else {
    console.log('\n❌ FAILED TO SEND EMAIL');
    console.log('Error:', data.message || data.code);
  }
}

sendTestEmail().catch(err => {
  console.error('Error:', err.message);
});
