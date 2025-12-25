import { SelectQuery, InsertQuery } from '@/lib/database';
import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400 }
      );
    }

    // Check if user exists
    const userResult = await SelectQuery(
      'SELECT id, first_name, role_id FROM users WHERE email = $1',
      [email]
    );

    let userId: number;
    let userName: string;
    let isNewUser = false;

    if (!userResult || userResult.length === 0) {
      // Create new user as Donor (role_id = 3)
      const defaultRoleId = 3;
      const newUserResult = await InsertQuery(
        `INSERT INTO users (first_name, last_name, email, role_id, is_verified, created_at, updated_at) 
         VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         RETURNING id, first_name`,
        [email.split('@')[0], '', email, defaultRoleId, false]
      );

      if (!newUserResult || newUserResult.rows.length === 0) {
        return NextResponse.json(
          { error: 'Failed to create user' },
          { status: 500 }
        );
      }

      userId = newUserResult.rows[0].id;
      userName = newUserResult.rows[0].first_name;
      isNewUser = true;
    } else {
      userId = userResult[0].id;
      userName = userResult[0].first_name || email.split('@')[0];
    }

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store/Update OTP
    await InsertQuery(
      `INSERT INTO otp_verifications (user_id, email, otp, expires_at, created_at) 
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
       ON CONFLICT (email) 
       DO UPDATE SET otp = $3, expires_at = $4, created_at = CURRENT_TIMESTAMP, user_id = $1`,
      [userId, email, otp, expiresAt]
    );

    // Send email
    await transporter.sendMail({
      from: `"${process.env.ORGANIZATION_NAME}" <${process.env.FROM_EMAIL}>`,
      to: email,
      subject: isNewUser ? 'Welcome to dwaparyug - Verify Your Email' : 'Your Login Code',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="background: #111827; color: white; display: inline-block; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 18px;">
              dwaparyug
            </div>
          </div>
          
          <h2 style="color: #111827; margin-bottom: 16px;">${isNewUser ? 'Welcome to dwaparyug!' : 'Sign in to dwaparyug'}</h2>
          
          <p style="color: #4B5563; font-size: 16px; line-height: 1.5;">
            ${isNewUser ? 'Welcome aboard! ' : ''}Use this code to ${isNewUser ? 'verify your email and complete registration' : 'sign in to your account'}:
          </p>
          
          <div style="background: #F3F4F6; padding: 24px; text-align: center; margin: 24px 0; border-radius: 8px;">
            <div style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #16A34A; font-family: 'Courier New', monospace;">
              ${otp}
            </div>
          </div>
          
          <p style="color: #DC2626; font-weight: 500; font-size: 14px;">
            ⏱ This code expires in 10 minutes
          </p>
          
          <p style="color: #6B7280; font-size: 14px; margin-top: 24px;">
            If you didn't request this code, please ignore this email.
          </p>
          
          <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 30px 0;">
          
          <p style="color: #9CA3AF; font-size: 12px; text-align: center;">
            This is an automated message from ${process.env.ORGANIZATION_NAME}. Please do not reply.
          </p>
        </div>
      `
    });

    return NextResponse.json({
      message: 'OTP sent successfully to your email',
      email: email,
      isNewUser: isNewUser
    });

  } catch (error: any) {
    console.error('Error sending OTP:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send OTP' },
      { status: 500 }
    );
  }
}