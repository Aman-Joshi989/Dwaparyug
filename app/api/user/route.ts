import { NextRequest, NextResponse } from 'next/server'
import { SelectQuery } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const role_id = searchParams.get('role_id');
    const is_verified = searchParams.get('is_verified');
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || 'u.created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const offset = (page - 1) * pageSize;

    let whereClause = '';
    const params: any[] = [];
    let paramIndex = 1;

    if (role_id) {
      whereClause += ` AND u.role_id = $${paramIndex}`;
      params.push(parseInt(role_id));
      paramIndex++;
    }

    if (is_verified !== null && is_verified !== '') {
      whereClause += ` AND u.is_verified = $${paramIndex}`;
      params.push(is_verified === 'true');
      paramIndex++;
    }

    if (search) {
      whereClause += ` AND (u.full_name ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex} OR u.mobile_no ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    const allowedSortFields = ['u.created_at', 'u.full_name', 'u.email', 'u.is_verified', 'ur.name'];
    const allowedSortOrders = ['asc', 'desc'];
    const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'u.created_at';
    const safeSortOrder = allowedSortOrders.includes(sortOrder.toLowerCase()) ? sortOrder.toUpperCase() : 'DESC';

    const usersQuery = `
      SELECT 
        u.id, u.first_name, u.last_name, u.full_name, u.mobile_no, 
        u.dob, u.email, u.is_verified, u.role_id, u.created_at, u.updated_at,
        ur.name as role_name
      FROM users u
      LEFT JOIN user_roles ur ON u.role_id = ur.id
      WHERE 1=1 ${whereClause}
      ORDER BY ${safeSortBy} ${safeSortOrder}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    params.push(pageSize, offset);

    const countQuery = `
      SELECT COUNT(*) as total
      FROM users u
      LEFT JOIN user_roles ur ON u.role_id = ur.id
      WHERE 1=1 ${whereClause}
    `;
    
    const countParams = params.slice(0, -2);
    const [result, countResult] = await Promise.all([
      SelectQuery(usersQuery, params),
      SelectQuery(countQuery, countParams)
    ]);

    const total = parseInt(countResult[0]?.total || '0');
    const totalPages = Math.ceil(total / pageSize);

    return NextResponse.json({
      users: result,
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}