

// File: app/api/batches/update-progress/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { UpdateQuery, SelectQuery } from '@/lib/database'

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { batch_id, donation_item_id, status } = body

    // Validate required fields
    if (!batch_id || !donation_item_id || !status) {
      return NextResponse.json(
        { error: 'Missing required fields: batch_id, donation_item_id, status' },
        { status: 400 }
      )
    }

    // Validate status values
    const validStatuses = ['allocated', 'prepared', 'distributed']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be one of: allocated, prepared, distributed' },
        { status: 400 }
      )
    }

    // Verify batch item exists
    const checkQuery = `
      SELECT bi.id, bi.status as current_status
      FROM batch_items bi
      WHERE bi.batch_id = $1 AND bi.donation_item_id = $2
    `
    
    const existingItems = await SelectQuery(checkQuery, [batch_id, donation_item_id])
    
    if (!existingItems || existingItems.length === 0) {
      return NextResponse.json(
        { error: 'Batch item not found' },
        { status: 404 }
      )
    }

    const currentStatus = existingItems[0].current_status

    // 1. Update batch_items status
    const updateBatchItemQuery = `
      UPDATE batch_items 
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE batch_id = $2 AND donation_item_id = $3
      RETURNING id, status
    `
    
    const batchItemResult = await UpdateQuery(updateBatchItemQuery, [
      status, 
      batch_id, 
      donation_item_id
    ])

    if (!batchItemResult || batchItemResult?.rows?.length === 0) {
      throw new Error('Failed to update batch item status')
    }

    // 2. Update donation_items fulfillment_status based on batch status
    let fulfillmentStatus = 'in_batch'
    if (status === 'distributed') {
      fulfillmentStatus = 'distributed'
    }

    const updateDonationItemQuery = `
      UPDATE donation_items 
      SET fulfillment_status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id, fulfillment_status
    `
    
    const donationItemResult = await UpdateQuery(updateDonationItemQuery, [
      fulfillmentStatus, 
      donation_item_id
    ])

    // 3. Get updated batch progress
    const progressQuery = `
      SELECT 
        COUNT(*) as total_items,
        COUNT(*) FILTER (WHERE bi.status = 'allocated') as allocated_count,
        COUNT(*) FILTER (WHERE bi.status = 'prepared') as prepared_count,
        COUNT(*) FILTER (WHERE bi.status = 'distributed') as distributed_count
      FROM batch_items bi
      WHERE bi.batch_id = $1
    `
    
    const progressResult = await SelectQuery(progressQuery, [batch_id])
    const progress = progressResult[0] || { total_items: 0, allocated_count: 0, prepared_count: 0, distributed_count: 0 }
    
    const totalItems = parseInt(progress.total_items || '0')
    const distributedCount = parseInt(progress.distributed_count || '0')
    const preparedCount = parseInt(progress.prepared_count || '0')
    
    const progressPercentage = totalItems > 0 
      ? Math.round((distributedCount * 100) / totalItems)
      : 0

    // 4. Update batch status if needed
    let batchStatus = 'planning'
    if (distributedCount > 0 && distributedCount < totalItems) {
      batchStatus = 'in_progress'
    } else if (distributedCount === totalItems && totalItems > 0) {
      batchStatus = 'completed'
    } else if (preparedCount > 0) {
      batchStatus = 'prepared'
    }

    const updateBatchStatusQuery = `
      UPDATE distribution_batches 
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `
    
    await UpdateQuery(updateBatchStatusQuery, [batchStatus, batch_id])

    return NextResponse.json({
      success: true,
      updated_item: {
        batch_id,
        donation_item_id,
        previous_status: currentStatus,
        new_status: status,
        fulfillment_status: fulfillmentStatus
      },
      batch_progress: {
        total_items: totalItems,
        allocated: parseInt(progress.allocated_count || '0'),
        prepared: preparedCount,
        distributed: distributedCount,
        progress_percentage: progressPercentage,
        batch_status: batchStatus
      }
    })

  } catch (error) {
    console.error('Error updating batch progress:', error)
    return NextResponse.json(
      { 
        error: 'Failed to update batch progress', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}
