const nodemailer = require('nodemailer')
const config = require('../config')

let transporter = null

const getTransporter = () => {
  if (transporter) return transporter

  transporter = nodemailer.createTransport({
    host: config.email.host,
    port: config.email.port,
    secure: config.email.port === 465,
    auth: {
      user: config.email.user,
      pass: config.email.pass,
    },
  })

  return transporter
}

const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const transporter = getTransporter()
    
    const info = await transporter.sendMail({
      from: `"Prodigy Chat" <${config.email.user}>`,
      to,
      subject,
      text,
      html,
    })

    return info
  } catch (error) {
    console.error('Send email error:', error)
    throw error
  }
}

const sendPasswordResetEmail = async (email, resetToken) => {
  const resetUrl = `${config.clientUrl}/reset-password?token=${resetToken}`
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); border-radius: 16px 16px 0 0; padding: 32px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Prodigy Chat</h1>
      </div>
      <div style="background: white; border-radius: 0 0 16px 16px; padding: 32px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);">
        <h2 style="color: #1e293b; margin-top: 0;">Reset your password</h2>
        <p>You requested to reset your password. Click the button below to create a new password:</p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${resetUrl}" style="background: #0ea5e9; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">Reset Password</a>
        </div>
        <p style="color: #64748b; font-size: 14px;">This link will expire in 1 hour. If you didn't request this, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
        <p style="color: #94a3b8; font-size: 12px; margin: 0;">Prodigy Chat - Secure messaging for everyone</p>
      </div>
    </body>
    </html>
  `

  const text = `
    Reset your password - Prodigy Chat
    
    You requested to reset your password. Visit this link to create a new password:
    ${resetUrl}
    
    This link will expire in 1 hour. If you didn't request this, please ignore this email.
  `

  return sendEmail({
    to: email,
    subject: 'Reset your Prodigy Chat password',
    html,
    text,
  })
}

const sendWelcomeEmail = async (email, username) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); border-radius: 16px 16px 0 0; padding: 32px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Welcome to Prodigy Chat!</h1>
      </div>
      <div style="background: white; border-radius: 0 0 16px 16px; padding: 32px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);">
        <h2 style="color: #1e293b; margin-top: 0;">Hi ${username},</h2>
        <p>Welcome to Prodigy Chat! We're excited to have you on board.</p>
        <p>Start connecting with friends, create group chats, share files, and enjoy secure messaging.</p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${config.clientUrl}" style="background: #0ea5e9; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">Start Chatting</a>
        </div>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
        <p style="color: #94a3b8; font-size: 12px; margin: 0;">Prodigy Chat - Secure messaging for everyone</p>
      </div>
    </body>
    </html>
  `

  return sendEmail({
    to: email,
    subject: 'Welcome to Prodigy Chat!',
    html,
    text: `Welcome to Prodigy Chat, ${username}! Start connecting at ${config.clientUrl}`,
  })
}

const sendFriendRequestEmail = async (email, senderName) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); border-radius: 16px 16px 0 0; padding: 32px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Prodigy Chat</h1>
      </div>
      <div style="background: white; border-radius: 0 0 16px 16px; padding: 32px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);">
        <h2 style="color: #1e293b; margin-top: 0;">New friend request</h2>
        <p><strong>${senderName}</strong> sent you a friend request.</p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${config.clientUrl}/friends" style="background: #0ea5e9; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">View Request</a>
        </div>
      </div>
    </body>
    </html>
  `

  return sendEmail({
    to: email,
    subject: `${senderName} sent you a friend request`,
    html,
    text: `${senderName} sent you a friend request on Prodigy Chat`,
  })
}

module.exports = {
  sendEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendFriendRequestEmail,
}