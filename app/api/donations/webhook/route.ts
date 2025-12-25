// app/api/donations/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { SelectQuery } from '@/lib/database'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('x-razorpay-signature')
    
    if (!signature) {
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      )
    }

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET!)
      .update(body)
      .digest('hex')

    if (signature !== expectedSignature) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    const event = JSON.parse(body)
    
    // Handle different event types
    switch (event.event) {
      case 'payment.failed':
        await handlePaymentFailed(event.payload.payment.entity)
        break
        
      case 'payment.captured':
        await handlePaymentCaptured(event.payload.payment.entity)
        break
        
      case 'order.paid':
        await handleOrderPaid(event.payload.order.entity)
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

async function handlePaymentFailed(payment: any) {
  try {
    // Update payment request status to failed
    const updateQuery = `
      UPDATE donation_payment_requests 
      SET status = 'failed', 
          payment_response = $1,
          updated_at = CURRENT_TIMESTAMP
      WHERE razorpay_order_id = $2
    `
    
    await SelectQuery(updateQuery, [
      JSON.stringify({
        razorpay_payment_id: payment.id,
        failure_reason: payment.error_reason,
        error_code: payment.error_code,
        error_description: payment.error_description,
        failed_at: new Date().toISOString()
      }),
      payment.order_id
    ])

    console.log('Payment failed updated for order:', payment.order_id)
    
  } catch (error) {
    console.error('Error handling payment failed:', error)
  }
}

async function handlePaymentCaptured(payment: any) {
  try {
    // Update payment request status to paid if not already processed
    const updateQuery = `
      UPDATE donation_payment_requests 
      SET status = 'paid',
          payment_response = COALESCE(payment_response, '{}') || $1::jsonb,
          updated_at = CURRENT_TIMESTAMP
      WHERE razorpay_order_id = $2 AND status != 'paid'
    `
    
    await SelectQuery(updateQuery, [
      JSON.stringify({
        captured_at: new Date().toISOString(),
        capture_method: 'webhook'
      }),
      payment.order_id
    ])

    console.log('Payment captured updated for order:', payment.order_id)
    
  } catch (error) {
    console.error('Error handling payment captured:', error)
  }
}

async function handleOrderPaid(order: any) {
  try {
    // Update payment request status to paid
    const updateQuery = `
      UPDATE donation_payment_requests 
      SET status = 'paid',
          payment_response = COALESCE(payment_response, '{}') || $1::jsonb,
          updated_at = CURRENT_TIMESTAMP
      WHERE razorpay_order_id = $2
    `
    
    await SelectQuery(updateQuery, [
      JSON.stringify({
        order_paid_at: new Date().toISOString(),
        webhook_processed: true
      }),
      order.id
    ])

    console.log('Order paid updated for order:', order.id)
    
  } catch (error) {
    console.error('Error handling order paid:', error)
  }
}

// API to manually update payment status (for testing or recovery)
export async function PATCH(request: NextRequest) {
  try {
    const { orderId, status, paymentId } = await request.json()
    
    if (!orderId || !status) {
      return NextResponse.json(
        { error: 'Order ID and status are required' },
        { status: 400 }
      )
    }

    const validStatuses = ['created', 'attempted', 'paid', 'failed', 'cancelled']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      )
    }

    const updateQuery = `
      UPDATE donation_payment_requests 
      SET status = $1,
          payment_response = COALESCE(payment_response, '{}') || $2::jsonb,
          updated_at = CURRENT_TIMESTAMP
      WHERE razorpay_order_id = $3
      RETURNING *
    `
    
    const updateData:any = {
      manual_update: true,
      updated_by: 'admin',
      updated_at: new Date().toISOString()
    }
    
    if (paymentId) {
      updateData.razorpay_payment_id = paymentId
    }
    
    const result = await SelectQuery(updateQuery, [
      status,
      JSON.stringify(updateData),
      orderId
    ])

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Payment request not found' },
        { status: 404 }
      )
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