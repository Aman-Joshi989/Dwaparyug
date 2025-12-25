// app/api/newsletter/route.ts
import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Email to organization
    const mailToOrganization = {
      from: process.env.EMAIL_USER,
      to: 'dwaparyugfoundation@gmail.com',
      subject: 'New Newsletter Subscription',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #dc2626 0%, #7f1d1d 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
              .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
              .footer { background: #f3f4f6; padding: 15px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px; color: #6b7280; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h2 style="margin: 0;">New Newsletter Subscription</h2>
              </div>
              <div class="content">
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Subscribed on:</strong> ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>
              </div>
              <div class="footer">
                <p>This email was sent from the Dwaparyug Foundation newsletter form</p>
              </div>
            </div>
          </body>
        </html>
      `,
    };

    // Confirmation email to subscriber
    const mailToSubscriber = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Welcome to Dwaparyug Foundation Newsletter',
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
              .highlight { background: #fef3c7; padding: 15px; border-left: 4px solid #f59e0b; margin: 20px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0;">Welcome to Our Community!</h1>
              </div>
              <div class="content">
                <p>Dear Subscriber,</p>
                <p>Thank you for subscribing to the Dwaparyug Foundation newsletter!</p>
                <p>You'll now receive:</p>
                <ul>
                  <li>Updates on our latest initiatives and campaigns</li>
                  <li>Impact stories from the communities we serve</li>
                  <li>Upcoming events and volunteer opportunities</li>
                  <li>Exclusive insights into our programs</li>
                </ul>
                <div class="highlight">
                  <p style="margin: 0;"><strong>Stay Connected:</strong> Follow us on social media for daily updates and behind-the-scenes content.</p>
                </div>
                <p>If you have any questions, feel free to reach out to us at <strong>dwaparyugfoundation@gmail.com</strong> or call <strong>+91 99993 03166</strong>.</p>
              </div>
              <div class="footer">
                <p style="margin: 0; font-weight: bold;">Dwaparyug Foundation</p>
                <p style="margin: 5px 0;">On His Path Of Dharma</p>
                <p style="margin: 5px 0;">📧 dwaparyugfoundation@gmail.com | 📞 +91 99993 03166</p>
                <p style="margin: 10px 0; font-size: 11px; color: #6b7280;">
                  You received this email because you subscribed to our newsletter. 
                  To unsubscribe, please reply to this email.
                </p>
              </div>
            </div>
          </body>
        </html>
      `,
    };

    await transporter.sendMail(mailToOrganization);
    await transporter.sendMail(mailToSubscriber);

    return NextResponse.json(
      {
        success: true,
        message: 'Successfully subscribed to newsletter!'
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error subscribing to newsletter:', error);
    return NextResponse.json(
      {
        error: 'Failed to subscribe. Please try again later.',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}