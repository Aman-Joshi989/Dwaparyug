
// File: app/api/batches/unassigned-count/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { SelectQuery } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const campaignProductId = searchParams.get('campaign_product_id')

    if (!campaignProductId) {
      return NextResponse.json(
        { error: 'Missing required parameter: campaign_product_id' },
        { status: 400 }
      )
    }

    // Validate that the campaign_product_id is a valid number
    const productId = parseInt(campaignProductId)
    if (isNaN(productId)) {
      return NextResponse.json(
        { error: 'Invalid campaign_product_id format' },
        { status: 400 }
      )
    }

    // Query to get unassigned donation items count and details
    const unassignedQuery = `
      SELECT 
        COUNT(di.id) as remaining_donation_items,
        COALESCE(SUM(di.quantity), 0) as remaining_quantity,
        COALESCE(SUM(di.total_price), 0) as remaining_value,
        MIN(d.donation_date) as earliest_donation_date,
        MAX(d.donation_date) as latest_donation_date
      FROM donation_items di
      JOIN donations d ON di.donation_id = d.id
      LEFT JOIN batch_items bi ON di.id = bi.donation_item_id
      WHERE di.campaign_product_id = $1
        AND di.fulfillment_status = 'pending'
        AND bi.donation_item_id IS NULL
    `

    const result = await SelectQuery(unassignedQuery, [productId])
    
    if (!result || result.length === 0) {
      return NextResponse.json({
        remaining_donation_items: 0,
        remaining_quantity: 0,
        remaining_value: 0,
        earliest_donation_date: null,
        latest_donation_date: null
      })
    }

    const data = result[0]

    return NextResponse.json({
      remaining_donation_items: parseInt(data.remaining_donation_items || '0'),
      remaining_quantity: parseInt(data.remaining_quantity || '0'),
      remaining_value: parseFloat(data.remaining_value || '0'),
      earliest_donation_date: data.earliest_donation_date,
      latest_donation_date: data.latest_donation_date
    })

  } catch (error) {
    console.error('Error fetching unassigned count:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch unassigned count', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}
