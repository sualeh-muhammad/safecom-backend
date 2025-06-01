const nodemailer = require('nodemailer');


const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

const sendWelcomeEmail = async ({ email, companyName, subdomain, firstName, tempPassword }) => {
  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Welcome to SafeCom CRM</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #007bff; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .credentials { background: #e9ecef; padding: 15px; margin: 20px 0; border-radius: 5px; }
            .btn { display: inline-block; padding: 12px 24px; background: #28a745; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Welcome to SafeCom CRM!</h1>
            </div>
            <div class="content">
                <h2>Hello ${firstName},</h2>
                <p>Your ${companyName} account has been successfully created and is now active.</p>
                
                <div class="credentials">
                    <h3>Your Login Details:</h3>
                    <strong>CRM URL:</strong> <a href="https://www.safecomcrm.com">https://www.safecomcrm.com</a><br>
                    <strong>Email:</strong> ${email}<br>
                    <strong>Password:</strong> <code>${tempPassword}</code>
                </div>
                
               
                <a href="https://www.safecomcrm.com" class="btn">Access Your Dashboard</a>
                
                <h3>Next Steps:</h3>
                <ol>
                    <li>Click the button above to access your dashboard</li>
                    <li>Login with your credentials</li>
                    <li>Complete your company profile</li>
                    <li>Add your team members</li>
                    <li>Create your first job site</li>
                    <li>Share your secure forms link with field workers and contractors</li>
                </ol>
                
                <p>Need help? Reply to this email or visit our support center.</p>
                
                <p>Welcome aboard!<br>
                <strong>The SafeCom Team</strong></p>
            </div>
        </div>
    </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: process.env.FROM_EMAIL,
      to: email,
      subject: `🎉 Welcome to SafeCom CRM - ${companyName}`,
      html: emailHtml
    });
    console.log(`✅ Welcome email sent to ${email}`);
  } catch (error) {
    console.error('❌ Failed to send welcome email:', error);
  }
};

module.exports = {
  sendWelcomeEmail
};