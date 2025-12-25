// app/api/donations/process-payment/route.ts
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { InsertQuery, SelectQuery } from '@/lib/database'
import { processImageUpload } from '@/lib/cloudinary'
import { sendDonationConfirmationEmail } from '@/lib/email-service'

interface DonationFormData {
  donorName?: string
  donorCountry: string
  mobileNumber: string
  customMessage?: string
  donationPurpose?: string
  specialInstructions?: string
  donatedOnBehalfOf?: string
  donorMessage?: string
  videoWishes?: string
  instaId?: string
  isPublic: boolean
  isAnonymous: boolean
  customAmount?: number
  tipAmount: number
  tipPercentage?: number
  customImage?: string | File
}



export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type')
    let body: any
    let imageUrl: string | null = null

    if (contentType?.includes('multipart/form-data')) {
      const formData = await request.formData()

      const imageFile = formData.get('customImage') as File
      if (imageFile && imageFile.size > 0) {
        imageUrl = await processImageUpload(
          imageFile,
          `donation_${Date.now()}_${imageFile.name.replace(/[^a-zA-Z0-9.]/g, '_')}`
        )
      }

      body = {
        razorpay_payment_id: formData.get('razorpay_payment_id') as string,
        razorpay_order_id: formData.get('razorpay_order_id') as string,
        razorpay_signature: formData.get('razorpay_signature') as string,
      }
    } else {
      body = await request.json()

      if (body.customImage && typeof body.customImage === 'string') {
        imageUrl = await processImageUpload(body.customImage, `donation_${Date.now()}`)
      }
    }

    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = body

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return NextResponse.json(
        { error: 'Missing payment verification data' },
        { status: 400 }
      )
    }

    // Verify payment signature
    const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
    hmac.update(razorpay_order_id + '|' + razorpay_payment_id)
    const generatedSignature = hmac.digest('hex')

    if (generatedSignature !== razorpay_signature) {
      await SelectQuery(
        `UPDATE donation_payment_requests 
         SET status = 'failed', payment_response = $1, updated_at = CURRENT_TIMESTAMP 
         WHERE razorpay_order_id = $2`,
        [JSON.stringify({ error: 'Invalid signature' }), razorpay_order_id]
      )

      return NextResponse.json(
        { error: 'Payment verification failed' },
        { status: 400 }
      )
    }

    // Get payment request details
    const paymentRequestQuery = `
  SELECT pr.*, td.cart_items, td.form_data
  FROM donation_payment_requests pr
  LEFT JOIN donation_temp_data td ON td.payment_request_id = pr.id
  WHERE pr.razorpay_order_id = $1
`

    const paymentRequestResult = await SelectQuery(paymentRequestQuery, [razorpay_order_id])

    if (paymentRequestResult.length === 0) {
      return NextResponse.json(
        { error: 'Payment request not found' },
        { status: 404 }
      )
    }

    const paymentRequest = paymentRequestResult[0]
    const cartItems: any = paymentRequest.cart_items || []
    const formData: DonationFormData = paymentRequest.form_data || {}

    // Get user_id from payment request (it should already be there)
    const userId = paymentRequest.user_id

    if (!userId) {
      console.error('❌ No user_id found in payment request:', paymentRequest.id)
      return NextResponse.json(
        { error: 'User ID not found in payment request' },
        { status: 400 }
      )
    }

    console.log('✅ Retrieved payment request:', {
      paymentRequestId: paymentRequest.id,
      userId: userId,
      campaignId: paymentRequest.campaign_id,
      amount: paymentRequest.amount
    })

    // Verify user exists
    const userCheckQuery = 'SELECT id, first_name, last_name, email FROM users WHERE id = $1'
    const userCheck = await SelectQuery(userCheckQuery, [userId])

    if (userCheck.length === 0) {
      console.error('❌ User not found:', userId)
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    console.log('✅ User verified:', {
      userId: userId,
      email: userCheck[0].email
    })


    // Start transaction
    try {
      // Update payment request status
      await SelectQuery(
        `UPDATE donation_payment_requests 
     SET status = 'paid', payment_response = $1, updated_at = CURRENT_TIMESTAMP 
     WHERE id = $2`,
        [
          JSON.stringify({
            razorpay_payment_id,
            razorpay_order_id,
            razorpay_signature,
            verified_at: new Date().toISOString()
          }),
          paymentRequest.id
        ]
      )

      console.log('✅ Payment request updated to paid status')

      // Calculate amounts
      const totalAmount = parseFloat(paymentRequest.amount)
      const tipAmount = formData.tipAmount || 0
      const donationAmount = totalAmount - tipAmount

      // Insert main donation record with EXPLICIT user_id
      const insertDonationQuery = `
    INSERT INTO donations (
      user_id, campaign_id, donation_payment_request_id, razorpay_payment_id, razorpay_signature,
      donation_amount, tip_amount, donation_type, is_public, donation_date,
      donated_on_behalf_of, donor_message
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    RETURNING id
  `

      const donationParams = [
        userId, // IMPORTANT: Use the userId from payment request
        paymentRequest.campaign_id,
        paymentRequest.id,
        razorpay_payment_id,
        razorpay_signature,
        donationAmount,
        tipAmount,
        paymentRequest.donation_type,
        formData.isPublic || false,
        new Date().toISOString(),
        formData.donatedOnBehalfOf || null,
        formData.donorMessage || null
      ]

      console.log('📝 Inserting donation with params:', {
        userId: donationParams[0],
        campaignId: donationParams[1],
        donationAmount: donationParams[5],
        totalAmount: donationParams[7]
      })

      const donationResult = await SelectQuery(insertDonationQuery, donationParams)
      const donationId = donationResult[0].id

      console.log('✅ Donation record created:', {
        donationId: donationId,
        userId: userId,
        amount: totalAmount
      })

      const campaignUpdates = new Map<number, { totalAmount: number, hasProducts: boolean }>()

      // Insert donation items for product-based donations
      if (paymentRequest.donation_type === 'product_based' && cartItems.length > 0) {
        for (const item of cartItems) {
          const insertItemQuery = `
            INSERT INTO donation_items (
              donation_id, campaign_product_id, quantity, price_per_unit, total_price,
              fulfillment_status, donation_date
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id
          `

          const itemParams = [
            donationId,
            item.productId,
            item.quantity,
            item.price,
            item.price * item.quantity,
            'pending',
            item.personalization?.donationDate || new Date().toISOString()
          ]

          const itemResult = await SelectQuery(insertItemQuery, itemParams)
          const donationItemId = itemResult[0].id

          // Get campaign product details
          const productQuery = `
            SELECT cp.campaign_id, cp.stock, cp.price 
            FROM campaign_products cp 
            WHERE cp.id = $1
          `
          const productResult = await SelectQuery(productQuery, [item.productId])

          if (productResult.length > 0) {
            const product = productResult[0]
            const campaignId = product.campaign_id
            const itemTotalAmount = item.price * item.quantity

            if (campaignUpdates.has(campaignId)) {
              const existing = campaignUpdates.get(campaignId)!
              existing.totalAmount += itemTotalAmount
              existing.hasProducts = true
            } else {
              campaignUpdates.set(campaignId, {
                totalAmount: itemTotalAmount,
                hasProducts: true
              })
            }

            // Update campaign product stock
            await SelectQuery(
              `UPDATE campaign_products 
               SET stock = stock - $1, updated_at = CURRENT_TIMESTAMP 
               WHERE id = $2 AND stock >= $1`,
              [item.quantity, item.productId]
            )

            const stockCheckQuery = `SELECT stock FROM campaign_products WHERE id = $1`
            const stockCheck = await SelectQuery(stockCheckQuery, [item.productId])

            if (stockCheck.length === 0 || stockCheck[0].stock < 0) {
              throw new Error(`Insufficient stock for product ID: ${item.productId}`)
            }
          }

          // Insert personalization options
          if (item.personalization && (formData.donorName || formData.donorCountry || formData.customMessage ||
            formData.donationPurpose || formData.specialInstructions || formData.instaId ||
            formData.videoWishes || imageUrl)) {

            const insertPersonalizationQuery = `
              INSERT INTO personalization_options (
                donation_item_id, donor_name, donor_country, custom_image, 
                is_image_available, custom_message, donation_purpose, special_instructions,
                insta_id, video_wishes
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            `

            const personalizationParams = [
              donationItemId,
              item.personalization.donorName || null,
              item.personalization.donorCountry || null,
              item.personalization.customImage || null,
              !!item.personalization.customImage,
              item.personalization.customMessage || null,
              item.personalization.donationPurpose || null,
              item.personalization.specialInstructions || null,
              item.personalization.instaId || null,
              item.personalization.videoWishes || null
            ]

            await InsertQuery(insertPersonalizationQuery, personalizationParams)
          }
        }
      } else if (paymentRequest.donation_type === 'direct') {
        const campaignId = paymentRequest.campaign_id
        if (campaignId) {
          campaignUpdates.set(campaignId, {
            totalAmount: donationAmount,
            hasProducts: false
          })
        }

        // For direct donations, create personalization options
        if (formData.donorName || formData.donorCountry || formData.customMessage ||
          formData.donationPurpose || formData.specialInstructions || formData.instaId ||
          formData.videoWishes || imageUrl) {

          const insertPersonalizationQuery = `
            INSERT INTO personalization_options (
              donation_id, donor_name, donor_country, custom_image, 
              is_image_available, custom_message, donation_purpose, special_instructions,
              insta_id, video_wishes
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          `

          const personalizationParams = [
            donationId,
            formData.donorName || null,
            formData.donorCountry || null,
            formData.customImage || imageUrl,
            !!(formData.customImage || imageUrl),
            formData.customMessage || null,
            formData.donationPurpose || null,
            formData.specialInstructions || null,
            formData.instaId || null,
            formData.videoWishes || null
          ]

          await SelectQuery(insertPersonalizationQuery, personalizationParams)
        }
      }

      // Update campaigns
      for (const [campaignId, updateData] of campaignUpdates) {
        const campaignQuery = `
          SELECT total_raised, donation_goal, total_donors_till_now 
          FROM campaigns 
          WHERE id = $1
        `
        const campaignResult = await SelectQuery(campaignQuery, [campaignId])

        if (campaignResult.length > 0) {
          const campaign = campaignResult[0]
          const newTotalRaised = parseFloat(campaign.total_raised || 0) + updateData.totalAmount
          const donationGoal = parseFloat(campaign.donation_goal || 0)

          const newProgressPercentage = donationGoal > 0
            ? Math.min((newTotalRaised / donationGoal) * 100, 100)
            : 0

          await SelectQuery(
            `UPDATE campaigns 
             SET total_donors_till_now = total_donors_till_now + 1,
                 total_raised = $1,
                 total_progress_percentage = $2,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $3`,
            [newTotalRaised, newProgressPercentage, campaignId]
          )
        }
      }

      // Clean up temporary data
      await SelectQuery(
        `DELETE FROM donation_temp_data WHERE payment_request_id = $1`,
        [paymentRequest.id]
      )

      // Send confirmation email with PDF receipt
      try {
        await sendDonationConfirmationEmail(donationId)
        console.log(`✅ Email sent successfully for donation ID: ${donationId}`)
      } catch (emailError) {
        // Log email error but don't fail the entire transaction
        console.error('Failed to send confirmation email:', emailError)
        // You might want to queue this for retry or log it to a monitoring service
      }

      // Get complete donation details for response
      const completeDonationQuery = `
        SELECT 
          d.*,
          c.title as campaign_title,
          po.donor_name,
          po.custom_image,
          COALESCE(
            (SELECT COUNT(*) FROM donation_items WHERE donation_id = d.id),
            0
          ) as item_count
        FROM donations d
        LEFT JOIN campaigns c ON c.id = d.campaign_id
        LEFT JOIN personalization_options po ON (po.donation_id = d.id OR po.donation_item_id IN (
          SELECT di.id FROM donation_items di WHERE di.donation_id = d.id LIMIT 1
        ))
        WHERE d.id = $1
      `

      const completeDonation = await SelectQuery(completeDonationQuery, [donationId])

      return NextResponse.json({
        success: true,
        message: 'Donation processed successfully. Confirmation email sent!',
        donation: completeDonation[0],
        payment_id: razorpay_payment_id,
        order_id: razorpay_order_id,
        user_id: userId,
        campaigns_updated: Array.from(campaignUpdates.keys()),
        total_amount: totalAmount,
        tip_amount: tipAmount
      }, { status: 200 })

    } catch (transactionError) {
      console.error('Transaction error:', transactionError)

      await SelectQuery(
        `UPDATE donation_payment_requests 
         SET status = 'failed', payment_response = $1, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $2`,
        [
          JSON.stringify({
            error: 'Transaction failed',
            details: transactionError instanceof Error ? transactionError.message : 'Unknown error'
          }),
          paymentRequest.id
        ]
      )

      throw transactionError
    }

  } catch (error) {
    console.error('Error processing payment:', error)

    return NextResponse.json(
      {
        error: 'Failed to process payment',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}