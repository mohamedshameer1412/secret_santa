require('dotenv').config();
const { sendEmail } = require('./utils/sendEmail');

async function testEmail() {
  try {
    // Get test email from environment variable (safer)
    const testEmailAddress = process.env.TEST_EMAIL || process.env.EMAIL_USER;
    
    if (!testEmailAddress) {
      console.error(' No test email address found!');
      console.log('Add TEST_EMAIL=your-email@example.com to your .env file');
      process.exit(1);
    }

    //  Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(testEmailAddress)) {
      console.error(' Invalid email format:', testEmailAddress);
      process.exit(1);
    }

    // Check if required env variables exist
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error(' Email credentials not found in .env');
      console.log('Required .env variables:');
      console.log('  - EMAIL_USER');
      console.log('  - EMAIL_PASS');
      process.exit(1);
    }

    console.log(' Testing email sending...');
    console.log(`   From: ${process.env.EMAIL_USER}`);
    console.log(`   To: ${testEmailAddress.replace(/(.{3}).*(@.*)/, '$1***$2')}`);  //  Hide email partially
    console.log('');

    await sendEmail(
      testEmailAddress,
      'Secret Santa - Email Test',
      `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f5;">
          <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h1 style="color: #cc0000; text-align: center; margin-bottom: 20px;">
               Secret Santa Email Test
            </h1>
            <p style="font-size: 16px; line-height: 1.6; color: #333;">
              Congratulations! Your email configuration is working correctly.
            </p>
            <p style="font-size: 14px; color: #666; margin-top: 20px;">
              <strong>Test Details:</strong><br>
              Sent at: ${new Date().toLocaleString()}<br>
              From: ${process.env.EMAIL_USER}
            </p>
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
              <p style="color: #999; font-size: 12px;">
                This is an automated test email from Secret Santa App
              </p>
            </div>
          </div>
        </div>
      `
    );

    console.log(' Email sent successfully!');
    console.log(' Check your inbox at:', testEmailAddress.replace(/(.{3}).*(@.*)/, '$1***$2'));
    process.exit(0);
  } catch (error) {
    console.error(' Error sending email:', error.message);
    
    // Provide helpful error messages
    if (error.code === 'EAUTH') {
      console.log('\n Authentication failed. Check:');
      console.log('   1. EMAIL_USER is correct');
      console.log('   2. EMAIL_PASS is an App Password (not your regular password)');
      console.log('   3. 2-Step Verification is enabled on your Google account');
    } else if (error.code === 'ECONNECTION') {
      console.log('\n Connection failed. Check:');
      console.log('   1. Your internet connection');
      console.log('   2. EMAIL_HOST and EMAIL_PORT are correct');
    }
    
    process.exit(1);
  }
}

testEmail();