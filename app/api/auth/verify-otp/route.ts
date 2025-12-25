import { SelectQuery, InsertQuery } from '@/lib/database';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email, otp } = await request.json();

    if (!email || !otp) {
      return NextResponse.json(
        { error: 'Email and OTP are required' },
        { status: 400 }
      );
    }

    // Get OTP from database with user role info
    const otpResult = await SelectQuery(
      `SELECT ov.user_id, ov.otp, ov.expires_at, u.role_id, ur.name as role_name
       FROM otp_verifications ov
       JOIN users u ON ov.user_id = u.id
       JOIN user_roles ur ON u.role_id = ur.id
       WHERE ov.email = $1 
       ORDER BY ov.created_at DESC 
       LIMIT 1`,
      [email]
    );

    if (!otpResult || otpResult.length === 0) {
      return NextResponse.json(
        { error: 'No OTP found for this email' },
        { status: 404 }
      );
    }

    const otpRecord = otpResult[0];

    // Check if OTP is expired
    if (new Date() > new Date(otpRecord.expires_at)) {
      return NextResponse.json(
        { error: 'OTP has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    // Verify OTP
    if (otpRecord.otp !== otp) {
      return NextResponse.json(
        { error: 'Invalid OTP' },
        { status: 400 }
      );
    }

    // Update user verification status
    await InsertQuery(
      'UPDATE users SET is_verified = true, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [otpRecord.user_id]
    );

    // Delete used OTP
    await InsertQuery(
      'DELETE FROM otp_verifications WHERE email = $1',
      [email]
    );

    // Get complete user details
    const userResult = await SelectQuery(
      `SELECT u.id, u.first_name, u.last_name, u.full_name, u.email, u.is_verified, ur.name as role
       FROM users u
       JOIN user_roles ur ON u.role_id = ur.id
       WHERE u.id = $1`,
      [otpRecord.user_id]
    );

    return NextResponse.json({
      message: 'Email verified successfully',
      user: userResult[0]
    });

  } catch (error: any) {
    console.error('Error verifying OTP:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to verify OTP' },
      { status: 500 }
    );
  }
}