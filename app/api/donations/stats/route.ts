// app/api/donations/stats/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { SelectQuery } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const campaignId = searchParams.get('campaignId')
    const userId = searchParams.get('userId')
    const period = searchParams.get('period') || '30days' // 7days, 30days, 90days, 1year, all
    
    // Build date filter
    let dateFilter = ''
    const params: any[] = []
    let paramCount = 0
    
    if (period !== 'all') {
      let days = 30
      switch (period) {
        case '7days': days = 7; break
        case '30days': days = 30; break
        case '90days': days = 90; break
        case '1year': days = 365; break
      }
      
      paramCount++
      dateFilter = `AND d.created_at >= CURRENT_DATE - INTERVAL '${days} days'`
    }
    
    let whereClause = 'WHERE dpr.status = \'paid\''
    
    if (campaignId) {
      paramCount++
      whereClause += ` AND d.campaign_id = $${paramCount}`
      params.push(parseInt(campaignId))
    }
    
    if (userId) {
      paramCount++
      whereClause += ` AND d.user_id = $${paramCount}`
      params.push(parseInt(userId))
    }

    // Get total donations statistics
    const totalStatsQuery = `
      SELECT 
        COUNT(d.id) as total_donations,
        SUM(d.total_amount) as total_amount,
        SUM(d.donation_amount) as total_donation_amount,
        SUM(d.tip_amount) as total_tip_amount,
        AVG(d.total_amount) as average_donation,
        COUNT(DISTINCT d.user_id) as unique_donors,
        COUNT(DISTINCT d.campaign_id) as campaigns_supported,
        SUM(d.beneficiaries_reached) as total_beneficiaries_reached
      FROM donations d
      LEFT JOIN donation_payment_requests dpr ON dpr.id = d.donation_payment_request_id
      ${whereClause} ${dateFilter}
    `
    
    const totalStats = await SelectQuery(totalStatsQuery, params)

    // Get donation type breakdown
    const typeBreakdownQuery = `
      SELECT 
        d.donation_type,
        COUNT(d.id) as count,
        SUM(d.total_amount) as total_amount
      FROM donations d
      LEFT JOIN donation_payment_requests dpr ON dpr.id = d.donation_payment_request_id
      ${whereClause} ${dateFilter}
      GROUP BY d.donation_type
      ORDER BY total_amount DESC
    `
    
    const typeBreakdown = await SelectQuery(typeBreakdownQuery, params)

    // Get top campaigns by donations
    const topCampaignsQuery = `
      SELECT 
        c.id,
        c.title,
        c.image,
        COUNT(d.id) as donation_count,
        SUM(d.total_amount) as total_raised
      FROM donations d
      LEFT JOIN campaigns c ON c.id = d.campaign_id
      LEFT JOIN donation_payment_requests dpr ON dpr.id = d.donation_payment_request_id
      ${whereClause} ${dateFilter}
      GROUP BY c.id, c.title, c.image
      ORDER BY total_raised DESC
      LIMIT 10
    `
    
    const topCampaigns = await SelectQuery(topCampaignsQuery, params)

    // Get monthly trend (last 12 months)
    const trendQuery = `
      SELECT 
        DATE_TRUNC('month', d.created_at) as month,
        COUNT(d.id) as donation_count,
        SUM(d.total_amount) as total_amount
      FROM donations d
      LEFT JOIN donation_payment_requests dpr ON dpr.id = d.donation_payment_request_id
      ${whereClause}
      AND d.created_at >= CURRENT_DATE - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', d.created_at)
      ORDER BY month DESC
      LIMIT 12
    `
    
    const monthlyTrend = await SelectQuery(trendQuery, params)

    // Get recent donations
    const recentDonationsQuery = `
      SELECT 
        d.*,
        c.title as campaign_title,
        c.image as campaign_image,
        po.donor_name,
        po.custom_image,
        CASE 
          WHEN d.is_public = true AND po.donor_name IS NOT NULL 
          THEN po.donor_name 
          ELSE 'Anonymous' 
        END as display_name
      FROM donations d
      LEFT JOIN campaigns c ON c.id = d.campaign_id
      LEFT JOIN donation_payment_requests dpr ON dpr.id = d.donation_payment_request_id
      LEFT JOIN personalization_options po ON (po.donation_id = d.id OR po.donation_item_id IN (
        SELECT di.id FROM donation_items di WHERE di.donation_id = d.id LIMIT 1
      ))
      ${whereClause} ${dateFilter}
      ORDER BY d.created_at DESC
      LIMIT 20
    `
    
    const recentDonations = await SelectQuery(recentDonationsQuery, params)

    // Format response
    const stats = {
      overview: {
        ...totalStats[0],
        total_amount: parseFloat(totalStats[0].total_amount || 0),
        total_donation_amount: parseFloat(totalStats[0].total_donation_amount || 0),
        total_tip_amount: parseFloat(totalStats[0].total_tip_amount || 0),
        average_donation: parseFloat(totalStats[0].average_donation || 0),
        total_beneficiaries_reached: parseInt(totalStats[0].total_beneficiaries_reached || 0)
      },
      typeBreakdown: typeBreakdown.map(item => ({
        ...item,
        total_amount: parseFloat(item.total_amount)
      })),
      topCampaigns: topCampaigns.map(item => ({
        ...item,
        total_raised: parseFloat(item.total_raised)
      })),
      monthlyTrend: monthlyTrend.map(item => ({
        ...item,
        total_amount: parseFloat(item.total_amount),
        month: item.month.toISOString().split('T')[0]
      })).reverse(),
      recentDonations: recentDonations.map(item => ({
        ...item,
        total_amount: parseFloat(item.total_amount),
        donation_amount: parseFloat(item.donation_amount),
        tip_amount: parseFloat(item.tip_amount || 0)
      })),
      period,
      generated_at: new Date().toISOString()
    }

    return NextResponse.json({
      success: true,
      stats
    }, { status: 200 })

  } catch (error) {
    console.error('Error fetching donation statistics:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch donation statistics', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}

// POST endpoint for campaign-specific impact updates
export async function POST(request: NextRequest) {
  try {
    const { campaignId, donationId, impactData } = await request.json()
    
    if (!campaignId && !donationId) {
      return NextResponse.json(
        { error: 'Either campaign ID or donation ID is required' },
        { status: 400 }
      )
    }

    let updateQuery = ''
    let params: any[] = []
    
    if (donationId) {
      // Update specific donation impact
      updateQuery = `
        UPDATE donations 
        SET impact_generated = $1,
            beneficiaries_reached = $2,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
        RETURNING *
      `
      
      params = [
        impactData.impact_generated || false,
        impactData.beneficiaries_reached || 0,
        donationId
      ]
    } else {
      // Update all donations for a campaign
      updateQuery = `
        UPDATE donations 
        SET impact_generated = $1,
            beneficiaries_reached = CASE 
              WHEN $2 > 0 THEN FLOOR(donation_amount / $2)
              ELSE beneficiaries_reached
            END,
            updated_at = CURRENT_TIMESTAMP
        WHERE campaign_id = $3 AND impact_generated = false
        RETURNING *
      `
      
      params = [
        true,
        impactData.cost_per_beneficiary || 100, // Default cost per beneficiary
        campaignId
      ]
    }

    const result = await SelectQuery(updateQuery, params)

    return NextResponse.json({
      success: true,
      message: 'Impact data updated successfully',
      updated_count: result.length,
      donations: result
    }, { status: 200 })

  } catch (error) {
    console.error('Error updating impact data:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to update impact data', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}