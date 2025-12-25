import { NextRequest, NextResponse } from 'next/server'
import { SelectQuery } from '@/lib/database'

export async function GET(
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

    const query = `
      SELECT 
        di.*,
        cp.description as campaign_product_description,
        cp.price as campaign_product_price,
        ip.id as independent_product_id,
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
    
    const result = await SelectQuery(query, [donationItemId])
    
    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Donation item not found' },
        { status: 404 }
      )
    }

    const item = result[0]

    return NextResponse.json({
      success: true,
      item: {
        id: item.id,
        donation_id: item.donation_id,
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
          image: item.product_image,
          unit: {
            name: item.unit_name,
            abbreviation: item.unit_abbreviation
          }
        },
        personalization: item.personalization_id ? {
          id: item.personalization_id,
          donor_name: item.donor_name,
          donor_country: item.donor_country,
          custom_message: item.custom_message,
          donation_purpose: item.donation_purpose,
          special_instructions: item.special_instructions,
          custom_image: item.custom_image,
          is_image_available: item.is_image_available
        } : null,
        created_at: item.created_at,
        updated_at: item.updated_at
      }
    }, { status: 200 })

  } catch (error) {
    console.error('Error fetching donation item:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch donation item', 
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

    if (quantity !== undefined && (quantity <= 0 || isNaN(quantity))) {
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

    const updateFields: string[] = []
    const updateValues: any[] = []
    let paramIndex = 1

    if (quantity !== undefined) {
      const pricePerUnit = parseFloat(currentItem.campaign_product_price || currentItem.price_per_unit)
      const totalPrice = quantity * pricePerUnit
      
      updateFields.push(`quantity = $${paramIndex++}`)
      updateValues.push(quantity)
      updateFields.push(`total_price = $${paramIndex++}`)
      updateValues.push(totalPrice)
    }

    if (donation_date !== undefined) {
      updateFields.push(`donation_date = $${paramIndex++}`)
      updateValues.push(donation_date)
    }

    if (updateFields.length > 0) {
      updateFields.push(`updated_at = CURRENT_TIMESTAMP`)
      updateValues.push(donationItemId)
      
      const updateItemQuery = `
        UPDATE donation_items
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `
      
      await SelectQuery(updateItemQuery, updateValues)
    }

    if (personalization) {
      const checkPersonalizationQuery = `
        SELECT id FROM personalization_options
        WHERE donation_item_id = $1
      `
      const personalizationResult = await SelectQuery(checkPersonalizationQuery, [donationItemId])

      if (personalizationResult.length > 0) {
        const personalizationId = personalizationResult[0].id
        const updatePersonalizationFields: string[] = []
        const updatePersonalizationValues: any[] = []
        let pParamIndex = 1

        if (personalization.donor_name !== undefined) {
          updatePersonalizationFields.push(`donor_name = $${pParamIndex++}`)
          updatePersonalizationValues.push(personalization.donor_name)
        }
        if (personalization.donor_country !== undefined) {
          updatePersonalizationFields.push(`donor_country = $${pParamIndex++}`)
          updatePersonalizationValues.push(personalization.donor_country)
        }
        if (personalization.custom_message !== undefined) {
          updatePersonalizationFields.push(`custom_message = $${pParamIndex++}`)
          updatePersonalizationValues.push(personalization.custom_message)
        }
        if (personalization.donation_purpose !== undefined) {
          updatePersonalizationFields.push(`donation_purpose = $${pParamIndex++}`)
          updatePersonalizationValues.push(personalization.donation_purpose)
        }
        if (personalization.special_instructions !== undefined) {
          updatePersonalizationFields.push(`special_instructions = $${pParamIndex++}`)
          updatePersonalizationValues.push(personalization.special_instructions)
        }
        if (personalization.custom_image !== undefined) {
          updatePersonalizationFields.push(`custom_image = $${pParamIndex++}`)
          updatePersonalizationValues.push(personalization.custom_image)
          updatePersonalizationFields.push(`is_image_available = $${pParamIndex++}`)
          updatePersonalizationValues.push(!!personalization.custom_image)
        }

        if (updatePersonalizationFields.length > 0) {
          updatePersonalizationValues.push(personalizationId)
          const updatePersonalizationQuery = `
            UPDATE personalization_options
            SET ${updatePersonalizationFields.join(', ')}
            WHERE id = $${pParamIndex}
          `
          await SelectQuery(updatePersonalizationQuery, updatePersonalizationValues)
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