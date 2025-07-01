require('dotenv').config();
const { sendEmail } = require('./utils/sendEmail');

async function testEmail() {
  try {
    
    console.log('Testing email sending...');
    await sendEmail(
      'janismiracline84@gmail.com', //Give your own email here
      'Secret Santa Email Test',
      '<h1>Email Test</h1><p>If you see this, email sending is working!</p>'
    );
    console.log('Email sent successfully!');
  } catch (error) {
    console.error('Error sending email:', error);
  }
}

testEmail();