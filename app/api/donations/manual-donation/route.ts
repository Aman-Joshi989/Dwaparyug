import { SelectQuery, getClient } from '@/lib/database';
import { NextRequest, NextResponse } from 'next/server';

interface DonationPayload {
  mobileNumber: string;
  amount: number;
  message?: string;
}

interface RequestBody {
  campaignCode: string;
  donations: DonationPayload[];
}

export async function POST(request: NextRequest) {
  const client = await getClient();
  
  try {
    const body: RequestBody = await request.json();
    const { campaignCode, donations } = body;

    // Validate request
    if (!campaignCode || !donations || donations.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Campaign code and donations are required' },
        { status: 400 }
      );
    }

    // Get campaign by code
    const campaignResult = await SelectQuery(
      'SELECT id, title, status FROM campaigns WHERE code = $1',
      [campaignCode]
    );

    if (!campaignResult || campaignResult.length === 0) {
      return NextResponse.json(
        { success: false, error: `Campaign not found with code: ${campaignCode}` },
        { status: 404 }
      );
    }

    const campaign = campaignResult[0];
    const campaignId = campaign.id;

    const results: any[] = [];
    const errors: any[] = [];
    let totalAmount = 0;

    // Get or create default user role
    let defaultRoleId: number;
    try {
      const roleResult = await client.query(
        "SELECT id FROM user_roles WHERE name = 'User' OR name = 'Donor' LIMIT 1"
      );
      
      if (roleResult.rows && roleResult.rows.length > 0) {
        defaultRoleId = roleResult.rows[0].id;
      } else {
        // Create default role if it doesn't exist
        const newRoleResult = await client.query(
          "INSERT INTO user_roles (name) VALUES ('User') RETURNING id"
        );
        defaultRoleId = newRoleResult.rows[0].id;
      }
    } catch (roleError) {
      console.error('Error getting/creating role:', roleError);
      // Fallback to NULL (some DBs allow NULL foreign keys)
      defaultRoleId = 1; // Try role_id 1 as fallback
    }

    // Start transaction
    await client.query('BEGIN');

    try {
      for (let i = 0; i < donations.length; i++) {
        const donation = donations[i];
        
        try {
          // Find or create user by mobile number
          let userId: number;
          
          const userResult = await client.query(
            'SELECT id, full_name FROM users WHERE mobile_no = $1',
            [donation.mobileNumber]
          );

          if (userResult.rows && userResult.rows.length > 0) {
            // User exists, use their ID
            userId = userResult.rows[0].id;
          } else {
            // User doesn't exist, create new one
            const newUserResult = await client.query(
              `INSERT INTO users (first_name, last_name, mobile_no, email, password, role_id, is_verified) 
               VALUES ($1, $2, $3, $4, $5, $6, $7) 
               RETURNING id`,
              [
                'Guest',
                'User',
                donation.mobileNumber,
                `user_${donation.mobileNumber}_${Date.now()}@temp.com`, // Unique email
                '$2b$10$ManualDonationPlaceholder', // Bcrypt-style placeholder
                defaultRoleId,
                false
              ]
            );
            userId = newUserResult.rows[0].id;
          }

          // Create payment request (manual donations don't have Razorpay order)
          const paymentRequestResult = await client.query(
            `INSERT INTO donation_payment_requests 
             (campaign_id, user_id, razorpay_order_id, amount, currency, donation_type, status) 
             VALUES ($1, $2, $3, $4, $5, $6, $7) 
             RETURNING id`,
            [
              campaignId,
              userId,
              `manual_${Date.now()}_${i}`, // Unique manual order ID
              donation.amount,
              'INR',
              'direct',
              'paid' // Manual donations are already paid
            ]
          );

          const paymentRequestId = paymentRequestResult.rows[0].id;

          // Create donation record
          const donationResult = await client.query(
            `INSERT INTO donations 
             (user_id, campaign_id, donation_payment_request_id, donation_amount, tip_amount, 
              donation_type, is_public, donation_date, donor_message) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
             RETURNING id`,
            [
              userId,
              campaignId,
              paymentRequestId,
              donation.amount,
              0, // No tip for manual donations
              'direct',
              false,
              new Date(),
              donation.message || null
            ]
          );

          const donationId = donationResult.rows[0].id;

          // Update campaign totals
          await client.query(
            `UPDATE campaigns 
             SET total_raised = total_raised + $1,
                 total_donors_till_now = total_donors_till_now + 1,
                 total_progress_percentage = CASE 
                   WHEN donation_goal > 0 THEN ((total_raised + $1) / donation_goal * 100)
                   ELSE 0 
                 END
             WHERE id = $2`,
            [donation.amount, campaignId]
          );

          totalAmount += donation.amount;

          results.push({
            success: true,
            index: i,
            donationId,
            paymentRequestId,
            userId,
            campaignId,
            amount: donation.amount,
            mobileNumber: donation.mobileNumber
          });
        } catch (error) {
          console.error(`Error processing donation at index ${i}:`, error);
          errors.push({
            success: false,
            index: i,
            mobileNumber: donation.mobileNumber,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      // Commit transaction
      await client.query('COMMIT');

      return NextResponse.json({
        success: errors.length === 0,
        totalProcessed: results.length,
        totalFailed: errors.length,
        totalAmount,
        results,
        errors: errors.length > 0 ? errors : undefined
      });

    } catch (error) {
      // Rollback on error
      await client.query('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error('Error processing manual donations:', error);
    return NextResponse.json(
      {
        success: false,
        totalProcessed: 0,
        totalFailed: 0,
        totalAmount: 0,
        results: [],
        error: error instanceof Error ? error.message : 'Failed to process donations'
      },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}