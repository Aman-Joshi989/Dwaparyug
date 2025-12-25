import { NextRequest, NextResponse } from 'next/server'
import { SelectQuery } from '@/lib/database'

interface StickerData {
  id: string
  donor_name: string
  custom_message: string
  donation_purpose: string
  product_name: string
  quantity: number
  batch_name: string
  campaign_title: string
  custom_image: string | null
  is_image_available: boolean
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: batchId } = await params
    const { searchParams } = new URL(request.url)
    
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '50')
    const template = searchParams.get('template') || 'template1'
    const format = searchParams.get('format') || '4'
    const includeImages = searchParams.get('includeImages') === 'true'
    const filterByImages = searchParams.get('filterByImages')

    if (!batchId || isNaN(parseInt(batchId))) {
      return NextResponse.json(
        { error: 'Valid batch ID is required' },
        { status: 400 }
      )
    }

    if (page < 1 || pageSize < 1 || pageSize > 200) {
      return NextResponse.json(
        { error: 'Invalid pagination parameters' },
        { status: 400 }
      )
    }

    const offset = (page - 1) * pageSize

    const batchCheck = await SelectQuery(
      'SELECT id, batch_name, campaign_id FROM distribution_batches WHERE id = $1',
      [batchId]
    )
    
    if (!batchCheck || batchCheck.length === 0) {
      return NextResponse.json(
        { error: 'Batch not found' },
        { status: 404 }
      )
    }

    const batch = batchCheck[0]

    const campaignInfo = await SelectQuery(
      'SELECT title FROM campaigns WHERE id = $1',
      [batch.campaign_id]
    )

    const campaignTitle = campaignInfo?.[0]?.title || 'Campaign'

    let baseQuery = `
      SELECT 
        bi.id as batch_item_id,
        bi.quantity_allocated,
        di.id as donation_item_id,
        di.quantity as original_quantity,
        cp.id as campaign_product_id,
        ip.name as product_name,
        po.donor_name,
        po.custom_message,
        po.donation_purpose,
        po.custom_image,
        po.is_image_available,
        COALESCE(po.donor_name, u.first_name || ' ' || u.last_name) as final_donor_name
      FROM batch_items bi
      INNER JOIN donation_items di ON bi.donation_item_id = di.id
      INNER JOIN donations d ON di.donation_id = d.id
      INNER JOIN campaign_products cp ON di.campaign_product_id = cp.id
      INNER JOIN indipendent_products ip ON cp.indipendent_product_id = ip.id
      LEFT JOIN personalization_options po ON di.id = po.donation_item_id
      LEFT JOIN users u ON d.user_id = u.id
      WHERE bi.batch_id = $1
    `

    let queryParams = [batchId]
    let paramCounter = 2

    if (filterByImages === 'with') {
      baseQuery += ` AND po.is_image_available = true`
    } else if (filterByImages === 'without') {
      baseQuery += ` AND (po.is_image_available = false OR po.is_image_available IS NULL)`
    }

    baseQuery += ` ORDER BY ip.name ASC, po.donor_name ASC LIMIT $${paramCounter} OFFSET $${paramCounter + 1}`
    queryParams.push(pageSize.toString(), offset.toString())

    const results = await SelectQuery(baseQuery, queryParams)

    let countQuery = `
      SELECT COUNT(*) as total
      FROM batch_items bi
      INNER JOIN donation_items di ON bi.donation_item_id = di.id
      INNER JOIN donations d ON di.donation_id = d.id
      INNER JOIN campaign_products cp ON di.campaign_product_id = cp.id
      INNER JOIN indipendent_products ip ON cp.indipendent_product_id = ip.id
      LEFT JOIN personalization_options po ON di.id = po.donation_item_id
      LEFT JOIN users u ON d.user_id = u.id
      WHERE bi.batch_id = $1
    `
    
    let countParams = [batchId]
    if (filterByImages === 'with') {
      countQuery += ` AND po.is_image_available = true`
    } else if (filterByImages === 'without') {
      countQuery += ` AND (po.is_image_available = false OR po.is_image_available IS NULL)`
    }

    const countResult = await SelectQuery(countQuery, countParams)
    const totalCount = countResult?.[0]?.total || 0

    const stickerData: StickerData[] = []
    
    results?.forEach(item => {
      const quantity = item.quantity_allocated || 1
      
      for (let i = 0; i < quantity; i++) {
        stickerData.push({
          id: `${item.batch_item_id}_${i + 1}`,
          donor_name: item.final_donor_name || 'Anonymous Donor',
          custom_message: item.custom_message || '',
          donation_purpose: item.donation_purpose || '',
          product_name: item.product_name || 'Food Package',
          quantity: 1,
          batch_name: batch.batch_name,
          campaign_title: campaignTitle,
          custom_image: (includeImages && item.is_image_available) ? item.custom_image : null,
          is_image_available: item.is_image_available || false
        })
      }
    })

    const totalStickers = stickerData.length
    const totalPages = Math.ceil(parseInt(totalCount) / pageSize)

    return NextResponse.json({
      success: true,
      data: {
        batch: {
          id: parseInt(batchId),
          name: batch.batch_name,
          campaign_title: campaignTitle
        },
        stickers: stickerData,
        template: template,
        format: parseInt(format),
        include_images: includeImages,
        pagination: {
          current_page: page,
          page_size: pageSize,
          total_count: parseInt(totalCount),
          total_stickers: totalStickers,
          total_pages: totalPages,
          has_next_page: page < totalPages,
          has_prev_page: page > 1
        }
      }
    })

  } catch (error) {
    console.error('Error fetching sticker data:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch sticker data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: batchId } = await params
    const body = await request.json()
    
    const {
      template = 'template1',
      format = 4,
      include_images = false,
      filter_by_images = 'all',
      custom_batch_name,
      page_range,
    } = body

    const validTemplates = ['template1', 'template2', 'template3', 'template4']
    if (!validTemplates.includes(template)) {
      return NextResponse.json(
        { error: 'Invalid template selected' },
        { status: 400 }
      )
    }

    const validFormats = [4, 8, 12]
    if (!validFormats.includes(format)) {
      return NextResponse.json(
        { error: 'Invalid format. Must be 4, 8, or 12 stickers per page' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      print_job: {
        id: `print_${Date.now()}`,
        batch_id: parseInt(batchId),
        template,
        format,
        include_images,
        filter_by_images,
        custom_batch_name: custom_batch_name || null,
        page_range,
        created_at: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Error creating print job:', error)
    return NextResponse.json(
      { 
        error: 'Failed to create print job',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}