// File: app/api/batches/create/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { SelectQuery, InsertQuery, UpdateQuery } from '@/lib/database'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      campaign_id, 
      batch_name, 
      description, 
      planned_distribution_date, 
      product_id 
    } = body

    // Validate required fields
    if (!campaign_id || !batch_name || !planned_distribution_date || !product_id) {
      return NextResponse.json(
        { error: 'Missing required fields: campaign_id, batch_name, planned_distribution_date, product_id' },
        { status: 400 }
      )
    }

    // Validate date format and ensure it's not in the past
    const plannedDate = new Date(planned_distribution_date)
    if (isNaN(plannedDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format for planned_distribution_date' },
        { status: 400 }
      )
    }

    // Verify campaign exists
    const campaignCheck = await SelectQuery(
      'SELECT id FROM campaigns WHERE id = $1',
      [campaign_id]
    )
    
    if (!campaignCheck || campaignCheck.length === 0) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Verify product exists and belongs to the campaign
    const productCheck = await SelectQuery(
      'SELECT id FROM campaign_products WHERE id = $1 AND campaign_id = $2',
      [product_id, campaign_id]
    )
    
    if (!productCheck || productCheck.length === 0) {
      return NextResponse.json(
        { error: 'Product not found or does not belong to this campaign' },
        { status: 404 }
      )
    }

    // 1. Insert new batch
    const insertBatchQuery = `
      INSERT INTO distribution_batches 
      (campaign_id, batch_name, batch_description, planned_distribution_date, status, created_at, updated_at)
      VALUES ($1, $2, $3, $4, 'planning', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING id, campaign_id, batch_name, batch_description, planned_distribution_date, status, created_at
    `
    
    const batchResult = await InsertQuery(insertBatchQuery, [
      campaign_id, 
      batch_name, 
      description || null, 
      planned_distribution_date
    ])

    if (!batchResult || batchResult?.rows?.length === 0) {
      throw new Error('Failed to create batch')
    }

    const newBatch = batchResult?.rows[0]
    const batchId = newBatch.id

    // 2. Fetch eligible donation items
    const eligibleItemsQuery = `
      SELECT 
        di.id,
        di.donation_id,
        di.campaign_product_id,
        di.quantity,
        di.price_per_unit,
        di.total_price
      FROM donation_items di
      JOIN donations d ON di.donation_id = d.id
      LEFT JOIN batch_items bi ON di.id = bi.donation_item_id
      WHERE di.campaign_product_id = $1
        AND di.fulfillment_status = 'pending'
        AND d.donation_date <= $2::date
        AND bi.donation_item_id IS NULL
      ORDER BY d.donation_date ASC
    `

    const eligibleItems = await SelectQuery(eligibleItemsQuery, [
      product_id, 
      planned_distribution_date
    ])

    let assignedItemsCount = 0
    let totalValue = 0
    let totalQuantity = 0

    // Only proceed if there are eligible items
    if (eligibleItems && eligibleItems.length > 0) {
      try {
        // 3. Bulk insert into batch_items
        const batchItemsValues = eligibleItems.map((_, index) => {
          const start = index * 4 + 1
          return `($${start}, $${start + 1}, $${start + 2}, $${start + 3})`
        }).join(', ')

        const bulkInsertQuery = `
          INSERT INTO batch_items (batch_id, donation_item_id, quantity_allocated, status)
          VALUES ${batchItemsValues}
        `

        const flatParams = eligibleItems.flatMap(item => [
          batchId,
          item.id,
          item.quantity,
          'allocated'
        ])

        await InsertQuery(bulkInsertQuery, flatParams)

        // 4. Update fulfillment_status in donation_items (only if items exist)
        const itemIds:any = eligibleItems.map(item => item.id)
        if (itemIds?.length > 0) {
          const updateItemsQuery = `
            UPDATE donation_items 
            SET fulfillment_status = 'in_batch', updated_at = CURRENT_TIMESTAMP
            WHERE id = ANY($1::int[])
          `
          
          await UpdateQuery(updateItemsQuery, [itemIds])
        }

        // Calculate totals
        assignedItemsCount = eligibleItems.length
        totalValue = eligibleItems.reduce((sum, item) => sum + parseFloat(item.total_price || '0'), 0)
        totalQuantity = eligibleItems.reduce((sum, item) => sum + parseInt(item.quantity || '0'), 0)

        // 5. Update batch with calculated totals
        const updateBatchQuery = `
          UPDATE distribution_batches 
          SET total_value = $1, total_items = $2, updated_at = CURRENT_TIMESTAMP
          WHERE id = $3
        `
        
        await UpdateQuery(updateBatchQuery, [totalValue, assignedItemsCount, batchId])

      } catch (assignmentError) {
        // If assignment fails, we should clean up the batch
        console.error('Error during item assignment:', assignmentError)
        await UpdateQuery('DELETE FROM distribution_batches WHERE id = $1', [batchId])
        throw new Error('Failed to assign items to batch')
      }
    }

    // Return success response with batch details
    return NextResponse.json({
      success: true,
      batch: {
        ...newBatch,
        total_value: totalValue,
        total_items: assignedItemsCount,
        total_quantity: totalQuantity
      },
      assignment_summary: {
        items_assigned: assignedItemsCount,
        total_value: totalValue,
        total_quantity: totalQuantity
      }
    })

  } catch (error) {
    console.error('Error creating batch:', error)
    return NextResponse.json(
      { 
        error: 'Failed to create batch', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}
