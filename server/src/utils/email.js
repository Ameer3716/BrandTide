import nodemailer from 'nodemailer'
import config from '../config/config.js'

// Create reusable transporter
const createTransporter = () => {
  // For development, use Ethereal (fake SMTP service) or configure your own SMTP
  if (config.nodeEnv === 'development' && !config.emailHost) {
    console.log('⚠️  Email service not configured. Using console output for development.')
    return null
  }

  return nodemailer.createTransport({
    host: config.emailHost,
    port: config.emailPort,
    secure: config.emailPort === 465, // true for 465, false for other ports
    auth: {
      user: config.emailUser,
      pass: config.emailPassword
    }
  })
}

// Send email function
export const sendEmail = async (options) => {
  const transporter = createTransporter()

  // Development mode: Log to console with nice formatting (no SMTP needed)
  if (!transporter) {
    console.log('\n┌─────────────────────────────────────────────────────┐')
    console.log('│ 📧 EMAIL NOTIFICATION (Development Mode)           │')
    console.log('├─────────────────────────────────────────────────────┤')
    console.log(`│ To:       ${options.email.padEnd(39)}│`)
    console.log(`│ From:     ${config.emailFrom.padEnd(39)}│`)
    console.log(`│ Subject:  ${options.subject.substring(0, 39).padEnd(39)}│`)
    console.log('├─────────────────────────────────────────────────────┤')
    console.log('│ Message:                                            │')
    const msg = (options.message || 'See HTML version').substring(0, 50)
    console.log(`│ ${msg.padEnd(51)}│`)
    console.log('└─────────────────────────────────────────────────────┘')
    console.log('✅ Email logged (would be sent in production)\n')
    return { success: true, mode: 'console', email: options.email }
  }

  // Production mode: Send actual email via SMTP
  const mailOptions = {
    from: `${config.emailFromName} <${config.emailFrom}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html
  }

  try {
    const info = await transporter.sendMail(mailOptions)
    console.log('✅ Email sent successfully:', info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('❌ Email send error:', error.message)
    throw new Error(`Email could not be sent: ${error.message}`)
  }
}

// Send password reset email
export const sendPasswordResetEmail = async (user, resetToken) => {
  const resetUrl = `${config.clientUrl}/reset-password?token=${resetToken}`

  const message = `
You are receiving this email because you (or someone else) has requested to reset your password.

Please click on the following link, or paste it into your browser to complete the process:

${resetUrl}

This link will expire in 10 minutes.

If you did not request this, please ignore this email and your password will remain unchanged.
  `

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .container {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 40px;
          border-radius: 12px;
          color: white;
        }
        .content {
          background: white;
          padding: 30px;
          border-radius: 8px;
          color: #333;
          margin-top: 20px;
        }
        .button {
          display: inline-block;
          padding: 12px 30px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          text-decoration: none;
          border-radius: 6px;
          margin: 20px 0;
          font-weight: bold;
        }
        .footer {
          margin-top: 20px;
          font-size: 12px;
          color: #666;
          text-align: center;
        }
        .warning {
          background: #fff3cd;
          border-left: 4px solid #ffc107;
          padding: 12px;
          margin: 15px 0;
          border-radius: 4px;
          color: #856404;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1 style="margin: 0;">🔐 BrandTide</h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9;">Password Reset Request</p>
      </div>
      <div class="content">
        <p>Hi ${user.name},</p>
        <p>We received a request to reset your password for your BrandTide account.</p>
        <p>Click the button below to reset your password:</p>
        <div style="text-align: center;">
          <a href="${resetUrl}" class="button">Reset Password</a>
        </div>
        <p style="color: #666; font-size: 14px;">Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #667eea; font-size: 13px;">${resetUrl}</p>
        <div class="warning">
          <strong>⏱️ Important:</strong> This link will expire in 10 minutes for security reasons.
        </div>
        <p>If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>
      </div>
      <div class="footer">
        <p>© ${new Date().getFullYear()} BrandTide. All rights reserved.</p>
        <p>This is an automated email. Please do not reply.</p>
      </div>
    </body>
    </html>
  `

  await sendEmail({
    email: user.email,
    subject: 'Password Reset Request - BrandTide',
    message,
    html
  })
}
