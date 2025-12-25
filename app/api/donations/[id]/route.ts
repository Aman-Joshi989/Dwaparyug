import { NextRequest, NextResponse } from 'next/server'
import { SelectQuery } from '@/lib/database'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const donationId = parseInt(id)
    
    if (isNaN(donationId)) {
      return NextResponse.json(
        { error: 'Invalid donation ID' },
        { status: 400 }
      )
    }
    
    const donationQuery = `
      SELECT 
        d.*,
        c.title as campaign_title,
        c.overview as campaign_overview,
        c.details as campaign_details,
        c.image as campaign_image,
        c.donation_goal,
        c.total_raised as campaign_total_raised,
        c.total_progress_percentage,
        c.total_beneficiary,
        c.location as campaign_location,
        c.organizer as campaign_organizer,
        c.status as campaign_status,
        cc.name as campaign_category,
        cc.description as campaign_category_description,
        dpr.razorpay_order_id,
        dpr.status as payment_status,
        dpr.created_at as payment_created_at,
        dpr.currency as payment_currency,
        u.full_name as user_name,
        u.first_name as user_first_name,
        u.last_name as user_last_name,
        u.email as user_email,
        u.mobile_no as user_mobile
      FROM donations d
      LEFT JOIN campaigns c ON c.id = d.campaign_id
      LEFT JOIN campaign_categories cc ON c.category_id = cc.id
      LEFT JOIN donation_payment_requests dpr ON dpr.id = d.donation_payment_request_id
      LEFT JOIN users u ON u.id = d.user_id
      WHERE d.id = $1
    `;
    
    const donationResult = await SelectQuery(donationQuery, [donationId])
    
    if (donationResult.length === 0) {
      return NextResponse.json(
        { error: 'Donation not found' },
        { status: 404 }
      )
    }

    const donation = donationResult[0]

    let donationItems: any = []
    if (donation.donation_type === 'product_based') {
      const itemsQuery = `
        SELECT 
          di.*,
          cp.description as campaign_product_description,
          cp.price as campaign_product_price,
          cp.stock as campaign_product_stock,
          ip.id as independent_product_id,
          ip.name as product_name,
          ip.description as product_description,
          ip.image as product_image,
          ip.min_qty,
          ip.max_qty,
          ip.increment_count,
          ip.is_flexible_increment_count,
          ip.allows_personalization,
          ip.status as product_status,
          cpu.name as unit_name,
          cpu.abbreviation as unit_abbreviation,
          po.id as personalization_id,
          po.donor_name,
          po.donor_country,
          po.custom_image,
          po.is_image_available,
          po.custom_message,
          po.donation_purpose,
          po.insta_id,
          po.video_wishes,
          po.special_instructions
        FROM donation_items di
        LEFT JOIN campaign_products cp ON cp.id = di.campaign_product_id
        LEFT JOIN indipendent_products ip ON cp.indipendent_product_id = ip.id
        LEFT JOIN campaign_product_units cpu ON ip.unit_id = cpu.id
        LEFT JOIN personalization_options po ON po.donation_item_id = di.id
        WHERE di.donation_id = $1
        ORDER BY di.id
      `
      
      donationItems = await SelectQuery(itemsQuery, [donationId])
    }

    let impactStories: any = []
    if (donation.impact_generated) {
      const impactQuery = `
        SELECT 
          dit.*,
          ist.title as story_title,
          ist.story_content,
          ist.impact_summary,
          ist.image_urls as story_images,
          ist.video_urls as story_videos,
          ist.people_helped as story_people_helped,
          ist.families_helped,
          ist.communities_helped,
          ist.location as story_location,
          ist.impact_date,
          ist.is_published,
          ist.featured,
          db.batch_name,
          db.actual_distribution_date,
          db.actual_location as batch_location,
          db.status as batch_status
        FROM donation_impact_tracking dit
        LEFT JOIN impact_stories ist ON dit.impact_story_id = ist.id
        LEFT JOIN distribution_batches db ON dit.batch_id = db.id
        WHERE dit.donation_id = $1
        ORDER BY dit.created_at DESC
      `
      
      impactStories = await SelectQuery(impactQuery, [donationId])
    }

    const response = {
      id: donation.id,
      donation_amount: parseFloat(donation.donation_amount),
      tip_amount: parseFloat(donation.tip_amount || 0),
      total_amount: parseFloat(donation.total_amount),
      donation_type: donation.donation_type,
      is_public: donation.is_public,
      donation_date: donation.donation_date,
      donated_on_behalf_of: donation.donated_on_behalf_of,
      donor_message: donation.donor_message,
      impact_generated: donation.impact_generated,
      beneficiaries_reached: donation.beneficiaries_reached || 0,
      created_at: donation.created_at,
      updated_at: donation.updated_at,
      razorpay_payment_id: donation.razorpay_payment_id,
      razorpay_signature: donation.razorpay_signature,
      razorpay_order_id: donation.razorpay_order_id,
      payment_status: donation.payment_status,
      payment_created_at: donation.payment_created_at,
      payment_currency: donation.payment_currency || 'INR',
      total_amount_formatted: parseFloat(donation.total_amount).toLocaleString('en-IN', {
        style: 'currency',
        currency: donation.payment_currency || 'INR'
      }),
      donation_amount_formatted: parseFloat(donation.donation_amount).toLocaleString('en-IN', {
        style: 'currency',
        currency: donation.payment_currency || 'INR'
      }),
      tip_amount_formatted: parseFloat(donation.tip_amount || 0).toLocaleString('en-IN', {
        style: 'currency',
        currency: donation.payment_currency || 'INR'
      }),
      user: donation.user_id ? {
        id: donation.user_id,
        name: donation.user_name,
        first_name: donation.user_first_name,
        last_name: donation.user_last_name,
        email: donation.user_email,
        mobile: donation.user_mobile
      } : null,
      campaign: {
        id: donation.campaign_id,
        title: donation.campaign_title,
        overview: donation.campaign_overview,
        details: donation.campaign_details,
        image: donation.campaign_image,
        donation_goal: parseFloat(donation.donation_goal || 0),
        total_raised: parseFloat(donation.campaign_total_raised || 0),
        progress_percentage: parseFloat(donation.total_progress_percentage || 0),
        total_beneficiary: donation.total_beneficiary || 0,
        location: donation.campaign_location,
        organizer: donation.campaign_organizer,
        status: donation.campaign_status,
        category: {
          name: donation.campaign_category,
          description: donation.campaign_category_description
        }
      },
      items: donationItems.map((item: any) => ({
        id: item.id,
        campaign_product_id: item.campaign_product_id,
        quantity: item.quantity,
        price_per_unit: parseFloat(item.price_per_unit),
        total_price: parseFloat(item.total_price),
        fulfillment_status: item.fulfillment_status,
        donation_date: item.donation_date,
        product: {
          independent_product_id: item.independent_product_id,
          name: item.product_name,
          description: item.product_description,
          campaign_description: item.campaign_product_description,
          image: item.product_image,
          current_campaign_price: parseFloat(item.campaign_product_price || 0),
          stock: item.campaign_product_stock || 0,
          min_qty: item.min_qty || 1,
          max_qty: item.max_qty,
          increment_count: item.increment_count || 1,
          is_flexible_increment_count: item.is_flexible_increment_count,
          allows_personalization: item.allows_personalization,
          status: item.product_status,
          unit: {
            name: item.unit_name,
            abbreviation: item.unit_abbreviation
          }
        },
        personalization: item.personalization_id ? {
          id: item.personalization_id,
          donor_name: item.donor_name,
          donor_country: item.donor_country,
          custom_image: item.custom_image,
          is_image_available: item.is_image_available,
          custom_message: item.custom_message,
          donation_purpose: item.donation_purpose,
          video_wishes: item?.video_wishes || '',
          insta_id: item?.insta_id || '',
          special_instructions: item.special_instructions
        } : null,
        created_at: item.created_at,
        updated_at: item.updated_at
      })),
      impact_stories: impactStories.map((impact: any) => ({
        tracking_id: impact.id,
        contribution_percentage: parseFloat(impact.contribution_percentage || 0),
        people_helped_by_this_donation: impact.people_helped_by_this_donation || 0,
        impact_description: impact.impact_description,
        story: {
          id: impact.impact_story_id,
          title: impact.story_title,
          content: impact.story_content,
          summary: impact.impact_summary,
          images: impact.story_images || [],
          videos: impact.story_videos || [],
          people_helped: impact.story_people_helped || 0,
          families_helped: impact.families_helped || 0,
          communities_helped: impact.communities_helped || 0,
          location: impact.story_location,
          impact_date: impact.impact_date,
          is_published: impact.is_published,
          featured: impact.featured
        },
        batch: impact.batch_name ? {
          name: impact.batch_name,
          distribution_date: impact.actual_distribution_date,
          location: impact.batch_location,
          status: impact.batch_status
        } : null,
        created_at: impact.created_at
      }))
    }

    return NextResponse.json({
      success: true,
      donation: response
    }, { status: 200 })

  } catch (error) {
    console.error('Error fetching donation details:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch donation details', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const donationItemId = parseInt(id)
    
    if (isNaN(donationItemId)) {
      return NextResponse.json(
        { error: 'Invalid donation item ID' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { quantity, donation_date, personalization } = body

    if (!quantity || quantity <= 0) {
      return NextResponse.json(
        { error: 'Valid quantity is required' },
        { status: 400 }
      )
    }

    const currentItemQuery = `
      SELECT di.*, cp.price as campaign_product_price
      FROM donation_items di
      LEFT JOIN campaign_products cp ON cp.id = di.campaign_product_id
      WHERE di.id = $1
    `
    const currentItemResult = await SelectQuery(currentItemQuery, [donationItemId])
    
    if (currentItemResult.length === 0) {
      return NextResponse.json(
        { error: 'Donation item not found' },
        { status: 404 }
      )
    }

    const currentItem = currentItemResult[0]
    const pricePerUnit = parseFloat(currentItem.campaign_product_price || currentItem.price_per_unit)
    const totalPrice = quantity * pricePerUnit

    const updateItemQuery = `
      UPDATE donation_items
      SET 
        quantity = $1,
        total_price = $2,
        donation_date = $3,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING *
    `
    
    const updateItemParams = [
      quantity,
      totalPrice,
      donation_date || currentItem.donation_date,
      donationItemId
    ]

    await SelectQuery(updateItemQuery, updateItemParams)

    if (personalization) {
      const checkPersonalizationQuery = `
        SELECT id FROM personalization_options
        WHERE donation_item_id = $1
      `
      const personalizationResult = await SelectQuery(checkPersonalizationQuery, [donationItemId])

      if (personalizationResult.length > 0) {
        const personalizationId = personalizationResult[0].id
        const updateFields: string[] = []
        const updateValues: any[] = []
        let paramIndex = 1

        if (personalization.donor_name !== undefined) {
          updateFields.push(`donor_name = $${paramIndex++}`)
          updateValues.push(personalization.donor_name)
        }
        if (personalization.donor_country !== undefined) {
          updateFields.push(`donor_country = $${paramIndex++}`)
          updateValues.push(personalization.donor_country)
        }
        if (personalization.custom_message !== undefined) {
          updateFields.push(`custom_message = $${paramIndex++}`)
          updateValues.push(personalization.custom_message)
        }
        if (personalization.donation_purpose !== undefined) {
          updateFields.push(`donation_purpose = $${paramIndex++}`)
          updateValues.push(personalization.donation_purpose)
        }
        if (personalization.special_instructions !== undefined) {
          updateFields.push(`special_instructions = $${paramIndex++}`)
          updateValues.push(personalization.special_instructions)
        }
        if (personalization.custom_image !== undefined) {
          updateFields.push(`custom_image = $${paramIndex++}`)
          updateValues.push(personalization.custom_image)
          updateFields.push(`is_image_available = $${paramIndex++}`)
          updateValues.push(!!personalization.custom_image)
        }

        if (updateFields.length > 0) {
          updateValues.push(personalizationId)
          const updatePersonalizationQuery = `
            UPDATE personalization_options
            SET ${updateFields.join(', ')}
            WHERE id = $${paramIndex}
          `
          await SelectQuery(updatePersonalizationQuery, updateValues)
        }
      } else {
        const insertPersonalizationQuery = `
          INSERT INTO personalization_options (
            donation_item_id,
            donor_name,
            donor_country,
            custom_message,
            donation_purpose,
            special_instructions,
            custom_image,
            is_image_available
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `
        
        await SelectQuery(insertPersonalizationQuery, [
          donationItemId,
          personalization.donor_name || null,
          personalization.donor_country || null,
          personalization.custom_message || null,
          personalization.donation_purpose || null,
          personalization.special_instructions || null,
          personalization.custom_image || null,
          !!personalization.custom_image
        ])
      }
    }

    const updatedItemQuery = `
      SELECT 
        di.*,
        cp.description as campaign_product_description,
        ip.name as product_name,
        ip.description as product_description,
        ip.image as product_image,
        cpu.name as unit_name,
        cpu.abbreviation as unit_abbreviation,
        po.id as personalization_id,
        po.donor_name,
        po.donor_country,
        po.custom_image,
        po.is_image_available,
        po.custom_message,
        po.donation_purpose,
        po.special_instructions
      FROM donation_items di
      LEFT JOIN campaign_products cp ON cp.id = di.campaign_product_id
      LEFT JOIN indipendent_products ip ON cp.indipendent_product_id = ip.id
      LEFT JOIN campaign_product_units cpu ON ip.unit_id = cpu.id
      LEFT JOIN personalization_options po ON po.donation_item_id = di.id
      WHERE di.id = $1
    `
    
    const updatedItemResult = await SelectQuery(updatedItemQuery, [donationItemId])
    const updatedItem = updatedItemResult[0]

    return NextResponse.json({
      success: true,
      message: 'Donation item updated successfully',
      item: {
        id: updatedItem.id,
        quantity: updatedItem.quantity,
        price_per_unit: parseFloat(updatedItem.price_per_unit),
        total_price: parseFloat(updatedItem.total_price),
        donation_date: updatedItem.donation_date,
        product: {
          name: updatedItem.product_name,
          description: updatedItem.product_description,
          image: updatedItem.product_image,
          unit: {
            name: updatedItem.unit_name,
            abbreviation: updatedItem.unit_abbreviation
          }
        },
        personalization: updatedItem.personalization_id ? {
          id: updatedItem.personalization_id,
          donor_name: updatedItem.donor_name,
          donor_country: updatedItem.donor_country,
          custom_message: updatedItem.custom_message,
          donation_purpose: updatedItem.donation_purpose,
          special_instructions: updatedItem.special_instructions,
          custom_image: updatedItem.custom_image,
          is_image_available: updatedItem.is_image_available
        } : null
      }
    }, { status: 200 })

  } catch (error) {
    console.error('Error updating donation item:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to update donation item', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}

// POST - Get all donations for a user
export async function POST(request: NextRequest) {
  try {
    const { userId, page = 1, limit = 10, status } = await request.json()
    
    const offset = (page - 1) * limit
    
    let whereClause = 'WHERE 1=1'
    const queryParams: any[] = []
    let paramCount = 0
    
    if (userId) {
      paramCount++
      whereClause += ` AND d.user_id = ${paramCount}`
      queryParams.push(userId)
    }
    
    if (status) {
      paramCount++
      whereClause += ` AND dpr.status = ${paramCount}`
      queryParams.push(status)
    }
    
    // Add pagination parameters
    queryParams.push(limit, offset)
    
    const donationsQuery = `
      SELECT 
        d.*,
        c.title as campaign_title,
        c.image as campaign_image,
        dpr.status as payment_status,
        dpr.created_at as payment_created_at,
        COUNT(di.id) as item_count
      FROM donations d
      LEFT JOIN campaigns c ON c.id = d.campaign_id
      LEFT JOIN donation_payment_requests dpr ON dpr.id = d.donation_payment_request_id
      LEFT JOIN donation_items di ON di.donation_id = d.id
      ${whereClause}
      GROUP BY d.id, c.title, c.image, dpr.status, dpr.created_at
      ORDER BY d.created_at DESC
      LIMIT ${paramCount + 1} OFFSET ${paramCount + 2}
    `
    
    const donations = await SelectQuery(donationsQuery, queryParams)
    
    // Get total count
    const countQuery = `
      SELECT COUNT(DISTINCT d.id) as total
      FROM donations d
      LEFT JOIN donation_payment_requests dpr ON dpr.id = d.donation_payment_request_id
      ${whereClause}
    `
    
    const countResult = await SelectQuery(countQuery, queryParams.slice(0, paramCount))
    const total = parseInt(countResult[0].total)
    
    return NextResponse.json({
      success: true,
      donations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    }, { status: 200 })

  } catch (error) {
    console.error('Error fetching donations:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch donations', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}