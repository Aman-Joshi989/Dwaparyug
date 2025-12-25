import { SelectQuery } from '@/lib/database';
import { NextRequest, NextResponse } from 'next/server';

// GET campaigns with search filtering (simplified - no pagination)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'Active';
    const search = searchParams.get('search') || '';
    const limit = parseInt(searchParams.get('limit') || '100');

    const whereConditions: string[] = [];
    const params: any[] = [];

    // Filter by status
    if (status) {
      whereConditions.push(`c.status = $${params.length + 1}`);
      params.push(status);
    }

    // Search by code or title
    if (search) {
      whereConditions.push(`(c.code ILIKE $${params.length + 1} OR c.title ILIKE $${params.length + 1})`);
      params.push(`%${search}%`);
    }

    // Build WHERE clause
    const whereClause = whereConditions.length > 0 
      ? 'WHERE ' + whereConditions.join(' AND ')
      : '';

    // Add limit to params
    params.push(limit);

    const campaignQuery = `
      SELECT 
        c.id,
        c.code,
        c.title,
        c.status
      FROM campaigns c
      ${whereClause}
      ORDER BY c.sequence DESC, c.created_at DESC
      LIMIT $${params.length}
    `;

    console.log('campaignQuery',campaignQuery)
    // Execute query
    const campaigns = await SelectQuery(campaignQuery, params);
    console.log("🚀 ~ GET ~ campaigns:", campaigns)
    console.log("🚀 ~ GET ~ params:", params)

    return NextResponse.json({
      success: true,
      campaigns
    });
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch campaigns' },
      { status: 500 }
    );
  }
}