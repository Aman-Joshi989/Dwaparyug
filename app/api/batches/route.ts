 

// File: app/api/batches/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { SelectQuery } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Pagination parameters
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '10')
    const offset = (page - 1) * pageSize

    // Filter parameters
    const campaignId = searchParams.get('campaign_id')
    const status = searchParams.get('status')
    const dateRange = searchParams.get('date_range')
    
    // Sorting parameters
    const sortBy = searchParams.get('sortBy') || 'created_at'
    const sortOrder = searchParams.get('sortOrder') || 'DESC'

    // Build WHERE clause
    let whereClause = ''
    const params: any[] = []
    let paramIndex = 1

    if (campaignId && campaignId !== 'all') {
      whereClause += ` AND db.campaign_id = $${paramIndex}`
      params.push(parseInt(campaignId))
      paramIndex++
    }

    if (status && status !== 'all') {
      whereClause += ` AND db.status = $${paramIndex}`
      params.push(status)
      paramIndex++
    }

    if (dateRange && dateRange !== 'all') {
      const now = new Date()
      let startDate: Date
      
      switch (dateRange) {
        case 'today':
          startDate = new Date(now.setHours(0, 0, 0, 0))
          break
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case 'month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          break
        default:
          startDate = new Date(0)
      }
      
      if (dateRange !== 'all') {
        whereClause += ` AND db.created_at >= $${paramIndex}`
        params.push(startDate.toISOString())
        paramIndex++
      }
    }

    // Validate sort column
    const allowedSortColumns = [
      'id', 'batch_name', 'status', 'planned_distribution_date', 
      'total_value', 'total_items', 'created_at', 'campaign_title'
    ]
    const validSortBy = allowedSortColumns.includes(sortBy) ? sortBy : 'created_at'
    const validSortOrder = ['ASC', 'DESC'].includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC'

    // Build the ORDER BY clause
    let orderByClause = ''
    if (validSortBy === 'campaign_title') {
      orderByClause = `c.title ${validSortOrder}`
    } else if (['total_value', 'total_items'].includes(validSortBy)) {
      orderByClause = `db.${validSortBy} ${validSortOrder}`
    } else if (['planned_distribution_date', 'created_at'].includes(validSortBy)) {
      orderByClause = `db.${validSortBy} ${validSortOrder}`
    } else {
      orderByClause = `db.${validSortBy} ${validSortOrder}`
    }

    // Main query
    const batchesQuery = `
      SELECT 
        db.id,
        db.campaign_id,
        c.title as campaign_title,
        c.image as campaign_image,
        db.batch_name,
        db.batch_description,
        db.planned_distribution_date,
        db.actual_distribution_date,
        db.status as batch_status,
        COALESCE(db.total_value, 0) as total_value,
        COALESCE(db.total_items, 0) as total_items,
        COALESCE(db.planned_beneficiaries, 0) as planned_beneficiaries,
        COALESCE(db.actual_beneficiaries, 0) as actual_beneficiaries,
        db.created_at,
        db.updated_at,
        
        -- Count of items by status
        COALESCE(item_status.allocated_count, 0) as allocated_items,
        COALESCE(item_status.prepared_count, 0) as prepared_items,
        COALESCE(item_status.distributed_count, 0) as distributed_items,
        
        -- Progress percentage
        CASE 
          WHEN COALESCE(db.total_items, 0) > 0 THEN 
            ROUND((COALESCE(item_status.distributed_count, 0) * 100.0 / db.total_items), 2)
          ELSE 0 
        END as progress_percentage

      FROM distribution_batches db
      LEFT JOIN campaigns c ON db.campaign_id = c.id
      LEFT JOIN (
        SELECT 
          bi.batch_id,
          COUNT(*) FILTER (WHERE bi.status = 'allocated') as allocated_count,
          COUNT(*) FILTER (WHERE bi.status = 'prepared') as prepared_count,
          COUNT(*) FILTER (WHERE bi.status = 'distributed') as distributed_count
        FROM batch_items bi
        GROUP BY bi.batch_id
      ) item_status ON db.id = item_status.batch_id
      
      WHERE 1=1 ${whereClause}
      ORDER BY ${orderByClause}, db.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `
    
    params.push(pageSize, offset)

    // Count query
    const countQuery = `
      SELECT COUNT(*) as total
      FROM distribution_batches db
      LEFT JOIN campaigns c ON db.campaign_id = c.id
      WHERE 1=1 ${whereClause}
    `
    const countParams = params.slice(0, -2)

    // Summary stats query
    const statsQuery = `
      SELECT 
        COUNT(*) as total_batches,
        COUNT(CASE WHEN db.status = 'planning' THEN 1 END) as planning_batches,
        COUNT(CASE WHEN db.status = 'prepared' THEN 1 END) as prepared_batches,
        COUNT(CASE WHEN db.status = 'in_progress' THEN 1 END) as in_progress_batches,
        COUNT(CASE WHEN db.status = 'completed' THEN 1 END) as completed_batches,
        COALESCE(SUM(db.total_value), 0) as total_value,
        COALESCE(SUM(db.total_items), 0) as total_items,
        COALESCE(SUM(db.actual_beneficiaries), 0) as total_beneficiaries_served
      FROM distribution_batches db
      LEFT JOIN campaigns c ON db.campaign_id = c.id
      WHERE 1=1 ${whereClause}
    `

    // Execute queries
    const [batches, countResult, statsResult] = await Promise.all([
      SelectQuery(batchesQuery, params),
      SelectQuery(countQuery, countParams),
      SelectQuery(statsQuery, countParams)
    ])

    const total = parseInt(countResult[0]?.total || '0')
    const totalPages = Math.ceil(total / pageSize)
    const stats = statsResult[0] || {}

    // Map the results to match frontend expectations
    const mappedBatches = (batches || []).map(batch => ({
      ...batch,
      status: batch.batch_status // Map batch_status to status for frontend compatibility
    }))

    return NextResponse.json({
      batches: mappedBatches,
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      statistics: {
        totalBatches: parseInt(stats.total_batches || '0'),
        planningBatches: parseInt(stats.planning_batches || '0'),
        preparedBatches: parseInt(stats.prepared_batches || '0'),
        inProgressBatches: parseInt(stats.in_progress_batches || '0'),
        completedBatches: parseInt(stats.completed_batches || '0'),
        totalValue: parseFloat(stats.total_value || '0'),
        totalItems: parseInt(stats.total_items || '0'),
        totalBeneficiariesServed: parseInt(stats.total_beneficiaries_served || '0')
      }
    })

  } catch (error) {
    console.error('Error fetching batches:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch batches', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}