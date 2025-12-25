import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.JWT_SECRET });

    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      id: token.userId,
      email: token.email,
      name: token.name,
      role_id: token.role_id
    });

  } catch (error: any) {
    console.error('Error getting user:', error);
    return NextResponse.json(
      { error: 'Failed to get user details' },
      { status: 500 }
    );
  }
}