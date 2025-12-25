// /api/users/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { SelectQuery, UpdateQuery } from '@/lib/database'
import bcrypt from 'bcryptjs'

// GET single user by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params

    const userQuery = `
      SELECT 
        u.id, u.first_name, u.last_name, u.full_name, u.mobile_no, 
        u.dob, u.email, u.is_verified, u.role_id, u.created_at, u.updated_at,
        ur.name as role_name
      FROM users u
      LEFT JOIN user_roles ur ON u.role_id = ur.id
      WHERE u.id = $1
    `

    const result = await SelectQuery(userQuery, [userId])

    if (!result || result.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      user: result[0]
    })
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    )
  }
}

// PUT update user by ID (Admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params
    const body = await request.json()

    // Extract data from JSON body
    const {
      first_name: firstName,
      last_name: lastName,
      mobile_no: mobileNo,
      email,
      dob,
      role_id: roleId,
      is_verified: isVerified,
      password
    } = body

    // Validate required fields
    if (!firstName || !lastName || !email || !mobileNo) {
      return NextResponse.json(
        { error: 'First name, last name, email, and mobile number are required' },
        { status: 400 }
      )
    }

    // Check if email is unique (excluding current user)
    const emailCheckQuery = `
      SELECT id FROM users 
      WHERE email = $1 AND id != $2
    `
    const emailExists = await SelectQuery(emailCheckQuery, [email, userId])
    
    if (emailExists && emailExists.length > 0) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 400 }
      )
    }

    // Prepare update data
    const updateData: any = {
      first_name: firstName,
      last_name: lastName,
      mobile_no: mobileNo,
      email: email,
      dob: dob || null,
      role_id: roleId ? parseInt(roleId) : null,
      is_verified: isVerified === true,
      updated_at: new Date().toISOString()
    }

    // Hash password if provided
    if (password && password.trim() !== '') {
      const saltRounds = 12
      updateData.password = await bcrypt.hash(password, saltRounds)
    }

    // Build update query
    const setClause = Object.keys(updateData)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ')

    const updateQuery = `
      UPDATE users 
      SET ${setClause}
      WHERE id = $1
      RETURNING id, first_name, last_name, full_name, mobile_no, dob, email, is_verified, role_id, updated_at
    `

    const queryParams: any = [userId, ...Object.values(updateData)]
    const result: any = await UpdateQuery(updateQuery, queryParams)

    if (!result || result.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      message: 'User updated successfully',
      user: result[0]
    })

  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    )
  }
}

// DELETE user by ID (Admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params

    // Check if user exists
    const userExists = await SelectQuery(
      'SELECT id FROM users WHERE id = $1',
      [userId]
    )

    if (!userExists || userExists.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Delete user (this might cascade delete related records depending on your FK constraints)
    await UpdateQuery('DELETE FROM users WHERE id = $1', [userId])

    return NextResponse.json({
      message: 'User deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    )
  }
}