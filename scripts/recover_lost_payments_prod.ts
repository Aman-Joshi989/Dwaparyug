import axios from 'axios'
import { SelectQuery } from '@/lib/database'

const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } = process.env

function getTimestamps(daysAgo: number) {
  const end = new Date()
  const start = new Date(end.getTime() - daysAgo * 24 * 60 * 60 * 1000)
  return { from: Math.floor(start.getTime() / 1000), to: Math.floor(end.getTime() / 1000) }
}

async function recoverPayments(daysAgo = 1) {
  const { from, to } = getTimestamps(daysAgo)
  const response = await axios.get('https://api.razorpay.com/v1/payments', {
    auth: { username: RAZORPAY_KEY_ID!, password: RAZORPAY_KEY_SECRET! },
    params: { from, to, count: 100 }
  })
  const payments = response.data.items

  for (const payment of payments) {
    if (payment.status !== 'captured') continue
    const exists = await SelectQuery(`SELECT 1 FROM donation_payment_requests WHERE razorpay_payment_id = $1`, [payment.id])
    if (exists.length > 0) continue

    await SelectQuery(`
      INSERT INTO donation_payment_requests (
        razorpay_order_id, razorpay_payment_id, status, payment_response, created_at, updated_at
      )
      VALUES ($1, $2, 'paid', $3::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT (razorpay_order_id) DO UPDATE SET
        status = 'paid',
        razorpay_payment_id = EXCLUDED.razorpay_payment_id,
        payment_response = donation_payment_requests.payment_response || EXCLUDED.payment_response,
        updated_at = CURRENT_TIMESTAMP
    `, [
      payment.order_id,
      payment.id,
      JSON.stringify({
        amount: payment.amount,
        method: payment.method,
        email: payment.email,
        contact: payment.contact,
        captured_at: new Date(payment.captured_at * 1000).toISOString(),
        recovered: true,
        source: 'razorpay_api_recovery'
      })
    ])
    // console.log(`Recovered payment: ${payment.id}`)
  }

//   console.log('Daily recovery complete.')
}

recoverPayments()
