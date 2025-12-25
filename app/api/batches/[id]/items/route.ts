import { NextRequest, NextResponse } from 'next/server'
import { SelectQuery } from '@/lib/database'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const batchIdNum = parseInt(id)
    
    if (isNaN(batchIdNum)) {
      return NextResponse.json(
        { error: 'Invalid batch ID format' },
        { status: 400 }
      )
    }

    const batchItemsQuery = `
      SELECT 
        bi.id,
        bi.donation_item_id,
        bi.quantity_allocated,
        bi.status as item_status,
        bi.created_at as assigned_at,
        di.quantity,
        di.price_per_unit,
        di.total_price,
        ip.name as campaign_product_name,
        COALESCE(u.full_name, 'Anonymous') as donor_name,
        COALESCE(u.email, '') as donor_email,
        d.donation_date,
        d.donor_message,
        d.donated_on_behalf_of,
        po.donor_name as personalized_donor_name,
        po.custom_message as personalized_message
      FROM batch_items bi
      JOIN donation_items di ON bi.donation_item_id = di.id
      JOIN donations d ON di.donation_id = d.id
      JOIN campaign_products cp ON di.campaign_product_id = cp.id
      JOIN indipendent_products ip ON cp.indipendent_product_id = ip.id
      LEFT JOIN users u ON d.user_id = u.id
      LEFT JOIN personalization_options po ON di.id = po.donation_item_id
      WHERE bi.batch_id = $1
      ORDER BY bi.status ASC, d.donation_date ASC
    `

    const batchItems = await SelectQuery(batchItemsQuery, [batchIdNum])

    const batchSummaryQuery = `
      SELECT 
        db.id,
        db.batch_name,
        db.status as batch_status,
        COALESCE(db.total_items, 0) as total_items,
        COALESCE(db.total_value, 0) as total_value,
        COUNT(bi.id) FILTER (WHERE bi.status = 'allocated') as allocated_count,
        COUNT(bi.id) FILTER (WHERE bi.status = 'prepared') as prepared_count,
        COUNT(bi.id) FILTER (WHERE bi.status = 'distributed') as distributed_count
      FROM distribution_batches db
      LEFT JOIN batch_items bi ON db.id = bi.batch_id
      WHERE db.id = $1
      GROUP BY db.id, db.batch_name, db.status, db.total_items, db.total_value
    `

    const batchSummary = await SelectQuery(batchSummaryQuery, [batchIdNum])

    const mappedBatchItems = (batchItems || []).map(item => ({
      ...item,
      status: item.item_status
    }))

    return NextResponse.json({
      batch: batchSummary[0] || null,
      items: mappedBatchItems,
      summary: {
        total_items: mappedBatchItems.length,
        allocated_items: mappedBatchItems.filter(item => item.status === 'allocated').length,
        prepared_items: mappedBatchItems.filter(item => item.status === 'prepared').length,
        distributed_items: mappedBatchItems.filter(item => item.status === 'distributed').length,
        //@ts-ignore
        total_value: mappedBatchItems.reduce((sum, item) => sum + Number(item?.total_price || 0), 0)
      }
    })

  } catch (error) {
    console.error('Error fetching batch items:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch batch items',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}