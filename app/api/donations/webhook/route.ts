import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { SelectQuery } from '@/lib/database'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('x-razorpay-signature')

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
    }

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET!)
      .update(body)
      .digest('hex')

    if (signature !== expectedSignature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    const event = JSON.parse(body)

    switch (event.event) {
      case 'payment.captured':
        await upsertPayment(event.payload.payment.entity)
        break

      case 'payment.failed':
        await upsertFailedPayment(event.payload.payment.entity)
        break

      case 'order.paid':
        await upsertOrderPaid(event.payload.order.entity)
        break

      default:
        console.log('Unhandled webhook event:', event.event)
    }

    return NextResponse.json({ success: true }, { status: 200 })

  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json(
      {
        error: 'Webhook processing failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/** Handle captured payments */
async function upsertPayment(payment: any) {
  const query = `
    INSERT INTO donation_payment_requests (
      razorpay_order_id,
      razorpay_payment_id,
      status,
      payment_response,
      created_at,
      updated_at
    ) VALUES ($1, $2, 'paid', $3::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT (razorpay_order_id) DO UPDATE SET
      status = 'paid',
      razorpay_payment_id = EXCLUDED.razorpay_payment_id,
      payment_response = donation_payment_requests.payment_response || EXCLUDED.payment_response,
      updated_at = CURRENT_TIMESTAMP
  `

  await SelectQuery(query, [
    payment.order_id,
    payment.id,
    JSON.stringify({
      amount: payment.amount,
      method: payment.method,
      email: payment.email,
      contact: payment.contact,
      captured_at: new Date().toISOString(),
      source: 'razorpay_webhook'
    })
  ])

  // console.log('Payment stored/updated:', payment.id)
}

/** Handle failed payments */
async function upsertFailedPayment(payment: any) {
  const query = `
    INSERT INTO donation_payment_requests (
      razorpay_order_id,
      razorpay_payment_id,
      status,
      payment_response,
      created_at,
      updated_at
    ) VALUES ($1, $2, 'failed', $3::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT (razorpay_order_id) DO UPDATE SET
      status = 'failed',
      razorpay_payment_id = EXCLUDED.razorpay_payment_id,
      payment_response = donation_payment_requests.payment_response || EXCLUDED.payment_response,
      updated_at = CURRENT_TIMESTAMP
  `

  await SelectQuery(query, [
    payment.order_id,
    payment.id,
    JSON.stringify({
      error_code: payment.error_code,
      error_description: payment.error_description,
      failed_at: new Date().toISOString()
    })
  ])

  // console.log('Payment failed updated:', payment.id)
}

/** Handle order paid events */
async function upsertOrderPaid(order: any) {
  const query = `
    INSERT INTO donation_payment_requests (
      razorpay_order_id,
      status,
      payment_response,
      created_at,
      updated_at
    ) VALUES ($1, 'paid', $2::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT (razorpay_order_id) DO UPDATE SET
      status = 'paid',
      payment_response = donation_payment_requests.payment_response || EXCLUDED.payment_response,
      updated_at = CURRENT_TIMESTAMP
  `

  await SelectQuery(query, [
    order.id,
    JSON.stringify({
      order_paid_at: new Date().toISOString(),
      webhook_processed: true
    })
  ])

  // console.log('Order paid updated/inserted:', order.id)
}

/** PATCH API to manually update payment status */
export async function PATCH(request: NextRequest) {
  try {
    const { orderId, status, paymentId } = await request.json()

    if (!orderId || !status) {
      return NextResponse.json({ error: 'Order ID and status are required' }, { status: 400 })
    }

    const validStatuses = ['created', 'attempted', 'paid', 'failed', 'cancelled']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const updateQuery = `
      UPDATE donation_payment_requests 
      SET status = $1,
          payment_response = COALESCE(payment_response, '{}') || $2::jsonb,
          updated_at = CURRENT_TIMESTAMP
      WHERE razorpay_order_id = $3
      RETURNING *
    `

    const updateData: any = {
      manual_update: true,
      updated_by: 'admin',
      updated_at: new Date().toISOString()
    }

    if (paymentId) updateData.razorpay_payment_id = paymentId

    const result = await SelectQuery(updateQuery, [
      status,
      JSON.stringify(updateData),
      orderId
    ])

    if (result.length === 0) {
      return NextResponse.json({ error: 'Payment request not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: 'Payment status updated successfully',
      paymentRequest: result[0]
    }, { status: 200 })

  } catch (error) {
    console.error('Error updating payment status:', error)
    return NextResponse.json(
      {
        error: 'Failed to update payment status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
