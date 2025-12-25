// File: app/api/campaign-products/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { SelectQuery } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const campaign_id = searchParams.get('campaign_id')
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')
    const status = searchParams.get('status') // Optional filter
    
    // Validate required parameters
    if (!campaign_id || isNaN(parseInt(campaign_id))) {
      return NextResponse.json(
        { error: 'Valid campaign_id is required' },
        { status: 400 }
      )
    }

    // Validate pagination parameters
    if (page < 1 || pageSize < 1 || pageSize > 100) {
      return NextResponse.json(
        { error: 'Invalid pagination parameters. Page must be >= 1, pageSize must be 1-100' },
        { status: 400 }
      )
    }

    const offset = (page - 1) * pageSize
    
    // First verify that the campaign exists
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

    // Build the main query with optional status filter
    let baseQuery = `
      SELECT 
        cp.id,
        cp.campaign_id,
        cp.indipendent_product_id,
        cp.description,
        cp.price,
        cp.stock,
        cp.sequence,
        cp.created_at,
        cp.updated_at,
        -- Include product details from indipendent_products
        ip.name,
        ip.description as product_description,
        ip.image as product_image,
        ip.min_qty,
        ip.max_qty,
        ip.increment_count,
        ip.is_flexible_increment_count,
        ip.allows_personalization,
        ip.status as product_status,
        -- Include unit information
        cpu.name as unit_name,
        cpu.abbreviation as unit_abbreviation
      FROM campaign_products cp
      INNER JOIN indipendent_products ip ON cp.indipendent_product_id = ip.id
      LEFT JOIN campaign_product_units cpu ON ip.unit_id = cpu.id
      WHERE cp.campaign_id = $1
    `
    
    let queryParams = [campaign_id]
    let paramCounter = 2

    // Add status filter if provided
    if (status && status.trim() !== '') {
      baseQuery += ` AND ip.status = $${paramCounter}`
      queryParams.push(status)
      paramCounter++
    }

    // Add ordering and pagination
    baseQuery += ` ORDER BY cp.sequence ASC, cp.created_at DESC LIMIT $${paramCounter} OFFSET $${paramCounter + 1}`
    queryParams.push(pageSize.toString(), offset.toString())

    // Execute main query
    const products = await SelectQuery(baseQuery, queryParams)

    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(*) as total
      FROM campaign_products cp
      INNER JOIN indipendent_products ip ON cp.indipendent_product_id = ip.id
      WHERE cp.campaign_id = $1
    `
    
    let countParams = [campaign_id]
    if (status && status.trim() !== '') {
      countQuery += ` AND ip.status = $2`
      countParams.push(status)
    }

    const countResult = await SelectQuery(countQuery, countParams)
    const totalCount = countResult && countResult.length > 0 ? parseInt(countResult[0].total) : 0

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / pageSize)
    const hasNextPage = page < totalPages
    const hasPrevPage = page > 1

    // Format the response data
    const formattedProducts = products?.map(product => ({
      id: product.id,
      campaign_id: product.campaign_id,
      indipendent_product_id: product.indipendent_product_id,
      description: product.description,
      price: parseFloat(product.price || '0'),
      stock: product.stock || 0,
      sequence: product.sequence || 1,
      created_at: product.created_at,
      updated_at: product.updated_at,
      
      // Product details
      name: product.name,
      product_description: product.product_description,
      product_image: product.product_image,
      min_qty: product.min_qty || 1,
      max_qty: product.max_qty,
      increment_count: product.increment_count || 1,
      is_flexible_increment_count: product.is_flexible_increment_count || true,
      allows_personalization: product.allows_personalization || true,
      product_status: product.product_status,
      
      // Unit information
      unit_name: product.unit_name,
      unit_abbreviation: product.unit_abbreviation
    })) || []

    return NextResponse.json({
      success: true,
      products: formattedProducts,
      pagination: {
        current_page: page,
        page_size: pageSize,
        total_count: totalCount,
        total_pages: totalPages,
        has_next_page: hasNextPage,
        has_prev_page: hasPrevPage
      },
      filters: {
        campaign_id: parseInt(campaign_id),
        status: status || null
      }
    })

  } catch (error) {
    console.error('Error fetching campaign products:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch campaign products', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}