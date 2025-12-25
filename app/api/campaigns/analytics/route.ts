import { SelectQuery } from '@/lib/database';
import { NextRequest, NextResponse } from 'next/server';

// GET campaign analytics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const campaign_id = searchParams.get('campaign_id');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    let whereClause = '';
    const params: any[] = [];
    let paramIndex = 1;

    if (campaign_id) {
      whereClause += ` AND c.id = $${paramIndex}`;
      params.push(parseInt(campaign_id));
      paramIndex++;
    }

    if (startDate) {
      whereClause += ` AND c.created_at >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      whereClause += ` AND c.created_at <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }

    // Get campaign analytics from the view
    const analyticsQuery = `
      SELECT * FROM campaign_analytics
      WHERE 1=1 ${whereClause}
      ORDER BY actual_amount_raised DESC
    `;

    const result = await SelectQuery(analyticsQuery, params);

    // Get summary statistics
    const summaryQuery = `
      SELECT 
        COUNT(*) as total_campaigns,
        SUM(donation_goal) as total_goals,
        SUM(actual_amount_raised) as total_raised,
        AVG(total_progress_percentage) as avg_progress,
        COUNT(CASE WHEN status = 'Active' THEN 1 END) as active_campaigns,
        COUNT(CASE WHEN status = 'Completed' THEN 1 END) as completed_campaigns
      FROM campaign_analytics
      WHERE 1=1 ${whereClause}
    `;

    const summaryResult = await SelectQuery(summaryQuery, params);

    return NextResponse.json({
      campaigns: result,
      summary: summaryResult[0]
    });
  } catch (error) {
    console.error('Error fetching campaign analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch campaign analytics' },
      { status: 500 }
    );
  }
}