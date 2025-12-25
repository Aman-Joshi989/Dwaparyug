// app/api/contact/route.ts
import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: NextRequest) {
  try {
    const { name, email, phone, organization, reason, message } = await req.json();

    // Validate required fields
    if (!name || !email || !reason || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create a transporter using your email service
    // Create reusable transporter object using the SMTP transport
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Email to your organization
    const mailToOrganization = {
      from: process.env.EMAIL_USER,
      to: 'dwaparyugfoundation@gmail.com', // Your organization email
      subject: `New Contact Form Submission: ${reason}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #dc2626 0%, #7f1d1d 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
              .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
              .field { margin-bottom: 15px; }
              .label { font-weight: bold; color: #374151; }
              .value { color: #1f2937; margin-top: 5px; }
              .footer { background: #f3f4f6; padding: 15px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px; color: #6b7280; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h2 style="margin: 0;">New Contact Form Submission</h2>
              </div>
              <div class="content">
                <div class="field">
                  <div class="label">Name:</div>
                  <div class="value">${name}</div>
                </div>
                <div class="field">
                  <div class="label">Email:</div>
                  <div class="value">${email}</div>
                </div>
                ${phone ? `
                <div class="field">
                  <div class="label">Phone:</div>
                  <div class="value">${phone}</div>
                </div>
                ` : ''}
                ${organization ? `
                <div class="field">
                  <div class="label">Organization:</div>
                  <div class="value">${organization}</div>
                </div>
                ` : ''}
                <div class="field">
                  <div class="label">Reason for Contact:</div>
                  <div class="value">${reason}</div>
                </div>
                <div class="field">
                  <div class="label">Message:</div>
                  <div class="value" style="white-space: pre-wrap;">${message}</div>
                </div>
              </div>
              <div class="footer">
                <p>This email was sent from the Dwaparyug Foundation contact form</p>
                <p>Received on: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>
              </div>
            </div>
          </body>
        </html>
      `,
    };

    // Confirmation email to the user
    const mailToUser = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Thank You for Contacting Dwaparyug Foundation',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #dc2626 0%, #7f1d1d 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
              .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
              .footer { background: #f3f4f6; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; }
              .button { display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #dc2626 0%, #7f1d1d 100%); color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
              .social-links { margin-top: 15px; }
              .social-links a { margin: 0 10px; color: #dc2626; text-decoration: none; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0;">Thank You, ${name}!</h1>
              </div>
              <div class="content">
                <p>Dear ${name},</p>
                <p>Thank you for reaching out to Dwaparyug Foundation. We have received your message regarding <strong>${reason}</strong>.</p>
                <p>Our team will review your inquiry and get back to you within 24 hours. We appreciate your interest in our work and look forward to connecting with you.</p>
                <p><strong>Your message:</strong></p>
                <p style="background: #f9fafb; padding: 15px; border-left: 4px solid #dc2626; white-space: pre-wrap;">${message}</p>
                <p>If you have any urgent questions, please feel free to call us at <strong>+91 99993 03166</strong>.</p>
                <a href="https://www.dwaparyug.org/" class="button">Visit Our Website</a>
              </div>
              <div class="footer">
                <p style="margin: 0; font-weight: bold;">Dwaparyug Foundation</p>
                <p style="margin: 5px 0;">Making a Positive Impact Together</p>
                <p style="margin: 5px 0;">📧 dwaparyugfoundation@gmail.com | 📞 +91 99993 03166</p>
                <div class="social-links">
                  <a href="#">Facebook</a> |
                  <a href="#">Instagram</a> |
                  <a href="#">Twitter</a> |
                  <a href="#">LinkedIn</a>
                </div>
              </div>
            </div>
          </body>
        </html>
      `,
    };

    // Send both emails
    await transporter.sendMail(mailToOrganization);
    await transporter.sendMail(mailToUser);

    return NextResponse.json(
      {
        success: true,
        message: 'Message sent successfully! We will get back to you soon.'
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      {
        error: 'Failed to send message. Please try again later.',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}