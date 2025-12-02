/**
 * Script to test Brevo email notifications
 * Usage: node scripts/test-email-notification.js [recipient-email]
 */

const path = require('path');

// Load environment configuration the same way as the main application
require(path.resolve(__dirname, '../src/envs/init.env.js'));

const brevo = require('@getbrevo/brevo');

async function testBrevoEmail() {
  try {
    console.log('\n🔍 Testing Brevo Email Configuration...\n');

    // Check environment variables (now loaded from envs/dev or envs/common)
    const BREVO_API_KEY = process.env.BREVO_API_KEY;
    const BREVO_ENABLED = process.env.BREVO_ENABLED;
    const BREVO_SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL || process.env.SMTP_EMAIL_EMAIL || 'noreply@example.com';
    const BREVO_SENDER_NAME = process.env.BREVO_SENDER_NAME || 'DeliveryDelight';

    console.log('📋 Configuration:');
    console.log(`   BREVO_ENABLED: ${BREVO_ENABLED}`);
    console.log(`   BREVO_API_KEY: ${BREVO_API_KEY ? BREVO_API_KEY.substring(0, 20) + '...' : 'NOT SET'}`);
    console.log(`   BREVO_SENDER_EMAIL: ${BREVO_SENDER_EMAIL}`);
    console.log(`   BREVO_SENDER_NAME: ${BREVO_SENDER_NAME}\n`);

    if (!BREVO_API_KEY) {
      console.error('❌ BREVO_API_KEY is not set in .env file');
      process.exit(1);
    }

    if (BREVO_ENABLED !== 'true') {
      console.error('❌ BREVO_ENABLED is not set to "true" in .env file');
      process.exit(1);
    }

    // Get recipient email from command line or use default
    const recipientEmail = process.argv[2];

    if (!recipientEmail) {
      console.error('❌ Recipient email is required');
      console.error('   Usage: node scripts/test-email-notification.js <recipient-email>');
      console.error('   Example: node scripts/test-email-notification.js user@example.com\n');
      process.exit(1);
    }

    console.log('🔧 Initializing Brevo API...');
    const apiInstance = new brevo.TransactionalEmailsApi();
    apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, BREVO_API_KEY);
    console.log('✅ Brevo API initialized\n');

    // Test 1: Check API Key validity by getting account info
    console.log('🔍 Test 1: Verifying API Key...');
    try {
      const accountApi = new brevo.AccountApi();
      accountApi.setApiKey(brevo.AccountApiApiKeys.apiKey, BREVO_API_KEY);
      const accountInfo = await accountApi.getAccount();
      console.log('✅ API Key is valid');
      console.log(`   Account Email: ${accountInfo.email || 'N/A'}`);
      console.log(`   Company Name: ${accountInfo.companyName || 'N/A'}`);
      if (accountInfo.plan && accountInfo.plan.length > 0) {
        console.log(`   Plan Type: ${accountInfo.plan[0].type || 'N/A'}\n`);
      } else {
        console.log(`   Plan Type: N/A\n`);
      }
    } catch (error) {
      console.error('❌ API Key verification failed:');
      console.error(`   ${error.message}`);
      if (error.response && error.response.body) {
        console.error(`   Details: ${JSON.stringify(error.response.body)}`);
      }
      process.exit(1);
    }

    // Test 2: Check sender email verification
    console.log('🔍 Test 2: Checking sender email verification...');
    try {
      const sendersApi = new brevo.SendersApi();
      sendersApi.setApiKey(brevo.SendersApiApiKeys.apiKey, BREVO_API_KEY);
      const senders = await sendersApi.getSenders();

      const senderEmails = senders.senders.map(s => s.email);
      console.log(`   Verified senders: ${senderEmails.join(', ')}`);

      if (senderEmails.includes(BREVO_SENDER_EMAIL)) {
        console.log(`✅ Sender email "${BREVO_SENDER_EMAIL}" is verified\n`);
      } else {
        console.warn(`⚠️  WARNING: Sender email "${BREVO_SENDER_EMAIL}" is NOT verified!`);
        console.warn(`   You need to verify this email in Brevo dashboard first.`);
        console.warn(`   Go to: https://app.brevo.com/settings/senders\n`);
        console.warn(`   For now, we'll use a verified sender if available...\n`);

        if (senderEmails.length > 0) {
          console.log(`   Using verified sender: ${senderEmails[0]}`);
        } else {
          console.error('❌ No verified senders found. Please add and verify a sender email in Brevo dashboard.');
          console.error('   Go to: https://app.brevo.com/settings/senders');
          process.exit(1);
        }
      }
    } catch (error) {
      console.error('⚠️  Could not check sender verification:');
      console.error(`   ${error.message}\n`);
    }

    // Test 3: Send test email
    console.log(`🔍 Test 3: Sending test email to ${recipientEmail}...`);

    const sendSmtpEmail = new brevo.SendSmtpEmail();
    sendSmtpEmail.sender = {
      email: BREVO_SENDER_EMAIL,
      name: BREVO_SENDER_NAME
    };
    sendSmtpEmail.to = [{
      email: recipientEmail,
      name: 'Test User'
    }];
    sendSmtpEmail.subject = 'Test Email from DeliveryDelight - Brevo Integration';
    sendSmtpEmail.htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0;">✅ Test Email</h1>
        </div>
        <div style="background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px;">
          <p>Hi there,</p>
          <p>This is a <strong>test email</strong> from your DeliveryDelight Brevo email integration!</p>

          <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="color: #4CAF50; margin-top: 0;">Configuration Details</h2>
            <p><strong>Sender:</strong> ${BREVO_SENDER_EMAIL}</p>
            <p><strong>Sender Name:</strong> ${BREVO_SENDER_NAME}</p>
            <p><strong>Recipient:</strong> ${recipientEmail}</p>
            <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
          </div>

          <div style="background-color: #e8f5e9; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; font-size: 16px;">
              ✅ If you received this email, your Brevo integration is working correctly!
            </p>
          </div>

          <div style="text-align: center; margin-top: 30px;">
            <p style="color: #666; font-size: 14px;">
              Email sent via Brevo API
            </p>
          </div>
        </div>
        <div style="text-align: center; margin-top: 20px; color: #666; font-size: 12px;">
          <p>&copy; ${new Date().getFullYear()} DeliveryDelight. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;

    try {
      const result = await apiInstance.sendTransacEmail(sendSmtpEmail);
      console.log('✅ Test email sent successfully!');
      console.log(`   Message ID: ${result.messageId}`);
      console.log(`   Recipient: ${recipientEmail}\n`);

      console.log('╔════════════════════════════════════════════════╗');
      console.log('║         ✅ Email Test Successful!             ║');
      console.log('╚════════════════════════════════════════════════╝');
      console.log('\n📧 Check your inbox at:', recipientEmail);
      console.log('⏰ Email may take a few seconds to arrive');
      console.log('📁 If not in inbox, check your spam/junk folder\n');

      console.log('💡 Tips:');
      console.log('   1. Check spam/junk folder if email doesn\'t arrive');
      console.log('   2. Verify sender email is verified in Brevo dashboard');
      console.log('   3. Check Brevo logs: https://app.brevo.com/email/logs');
      console.log('   4. Make sure sender email is different from recipient\n');

    } catch (error) {
      console.error('\n❌ Failed to send test email:');
      console.error(`   Error: ${error.message}`);

      if (error.response && error.response.body) {
        console.error('\n📋 Error Details:');
        console.error(JSON.stringify(error.response.body, null, 2));
      }

      console.log('\n🔧 Troubleshooting:');
      console.log('   1. Verify your API key is correct');
      console.log('   2. Verify sender email in Brevo dashboard: https://app.brevo.com/settings/senders');
      console.log('   3. Check API key permissions in Brevo dashboard');
      console.log('   4. Make sure you haven\'t exceeded your daily email limit\n');

      process.exit(1);
    }

    process.exit(0);

  } catch (error) {
    console.error('\n❌ Unexpected error:', error);
    process.exit(1);
  }
}

testBrevoEmail();
