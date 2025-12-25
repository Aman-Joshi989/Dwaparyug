import { NextRequest, NextResponse } from 'next/server'
import Razorpay from 'razorpay'
import { SelectQuery } from '@/lib/database'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
})


export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized. Please login to make a donation.' },
        { status: 401 }
      )
    }

    const sessionUserId = parseInt(session.user.id)

    const body = await request.json()
    const {
      user_id, // Accept both snake_case
      userId,  // and camelCase
      cartItems,
      customDonationId,
      formData,
      totalAmount,
      donationAmount,
      tipAmount,
    } = body

    // Use whichever format was sent, prioritize user_id
    const requestUserId = user_id || userId

    // Validate user_id matches session
    if (!requestUserId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const parsedRequestUserId = parseInt(requestUserId.toString())

    if (parsedRequestUserId !== sessionUserId) {
      console.error('User ID mismatch:', {
        requestUserId: parsedRequestUserId,
        sessionUserId: sessionUserId
      })
      return NextResponse.json(
        { error: 'User ID mismatch. Please login again.' },
        { status: 403 }
      )
    }

    console.log('✅ User authenticated:', {
      userId: sessionUserId,
      email: session.user.email,
      name: session.user.name
    })

    // Validation
    if (!totalAmount || totalAmount <= 0) {
      return NextResponse.json(
        { error: 'Invalid total amount' },
        { status: 400 }
      )
    }

    // Extract donor info from cart items personalization if formData is empty
    let donorInfo = formData || {};

    if ((!donorInfo.mobileNumber || !donorInfo.donorName) && cartItems && cartItems.length > 0) {
      const firstItemWithPersonalization = cartItems.find((item: any) => item.personalization);

      if (firstItemWithPersonalization && firstItemWithPersonalization.personalization) {
        donorInfo = {
          ...donorInfo,
          donorName: firstItemWithPersonalization.personalization.donorName || donorInfo.donorName,
          mobileNumber: firstItemWithPersonalization.personalization.mobileNumber || donorInfo.mobileNumber,
          donorCountry: firstItemWithPersonalization.personalization.donorCountry || donorInfo.donorCountry || 'IN',
          donatedOnBehalfOf: firstItemWithPersonalization.personalization.donatedOnBehalfOf || donorInfo.donatedOnBehalfOf,
          customMessage: firstItemWithPersonalization.personalization.customMessage || donorInfo.customMessage,
          donationPurpose: firstItemWithPersonalization.personalization.donationPurpose || donorInfo.donationPurpose,
          videoWishes: firstItemWithPersonalization.personalization.videoWishes || donorInfo.videoWishes,
          instaId: firstItemWithPersonalization.personalization.instaId || donorInfo.instaId,
          isAnonymous: firstItemWithPersonalization.personalization.isAnonymous ?? donorInfo.isAnonymous
        };
      }
    }

    // Validate required donor information
    if (!donorInfo || !donorInfo.mobileNumber) {
      return NextResponse.json(
        { error: 'Mobile number is required' },
        { status: 400 }
      )
    }

    if (!cartItems || (!Array.isArray(cartItems) && !donationAmount)) {
      return NextResponse.json(
        { error: 'Cart items or donation amount required' },
        { status: 400 }
      )
    }

    // Verify user exists in database
    const userResult = await SelectQuery(
      'SELECT id, first_name, last_name, email, mobile_no FROM users WHERE id = $1',
      [sessionUserId]
    )

    if (!userResult || userResult.length === 0) {
      return NextResponse.json(
        { error: 'User not found in database' },
        { status: 404 }
      )
    }

    const dbUser = userResult[0]
    console.log('✅ User verified in database:', {
      id: dbUser.id,
      email: dbUser.email
    })

    const donationType = cartItems && cartItems.length > 0 ? 'product_based' : 'direct'
    let campaignId = cartItems && cartItems.length > 0 ? cartItems[0].campaignId : null

    if (!campaignId || campaignId <= 0 && Number(customDonationId) > 0) {
      campaignId = customDonationId
    }

    if (!campaignId) {
      const defaultCampaignQuery = `
        SELECT id FROM campaigns 
        WHERE status = 'Active'  
        ORDER BY created_at DESC LIMIT 1
      `
      const defaultCampaign = await SelectQuery(defaultCampaignQuery, [])

      if (defaultCampaign.length > 0) {
        campaignId = defaultCampaign[0].id
      } else {
        return NextResponse.json(
          { error: 'No active campaigns found' },
          { status: 400 }
        )
      }
    }

    // Create Razorpay order
    const orderOptions = {
      amount: Math.round(totalAmount * 100),
      currency: 'INR',
      receipt: `donation_${Date.now()}`,
      notes: {
        donation_type: donationType,
        campaign_id: campaignId.toString(),
        user_id: sessionUserId.toString(), // Store user_id in notes
        tip_amount: tipAmount.toString(),
        donation_amount: donationAmount.toString(),
        mobile_number: donorInfo.mobileNumber
      }
    }

    const razorpayOrder = await razorpay.orders.create(orderOptions)

    console.log('✅ Razorpay order created:', {
      orderId: razorpayOrder.id,
      amount: totalAmount,
      userId: sessionUserId
    })

    // Insert payment request with user_id
    const insertPaymentRequestQuery = `
      INSERT INTO donation_payment_requests (
        campaign_id, user_id, razorpay_order_id, amount, currency, 
        donation_type, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id
    `

    const paymentRequestParams = [
      campaignId,
      sessionUserId, // Use the validated session user ID
      razorpayOrder.id,
      totalAmount,
      'INR',
      donationType,
      'created'
    ]

    const paymentRequestResult = await SelectQuery(insertPaymentRequestQuery, paymentRequestParams)
    const paymentRequestId = paymentRequestResult[0].id

    console.log('✅ Payment request created:', {
      paymentRequestId,
      userId: sessionUserId,
      orderId: razorpayOrder.id
    })

    // Store donor info in temp data
    const tempDataQuery = `
      INSERT INTO donation_temp_data (
        payment_request_id, cart_items, form_data, created_at
      ) VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
    `

    await SelectQuery(tempDataQuery, [
      paymentRequestId,
      JSON.stringify(cartItems || []),
      JSON.stringify(donorInfo)
    ])

    return NextResponse.json({
      success: true,
      orderId: razorpayOrder.id,
      amount: totalAmount,
      currency: razorpayOrder.currency,
      paymentRequestId: paymentRequestId,
      userId: sessionUserId,
      key: process.env.RAZORPAY_KEY_ID
    }, { status: 200 })

  } catch (error) {
    console.error('❌ Error creating payment order:', error)

    return NextResponse.json(
      {
        error: 'Failed to create payment order',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}


// GET - List donations with authentication check
export async function GET(request: NextRequest) {
  try {
    // Check authentication for viewing donations
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please login to view donations.' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const offset = (page - 1) * pageSize;

    const search = searchParams.get('search');
    const campaignId = searchParams.get('campaign_id');
    const userId = searchParams.get('user_id');
    const donationType = searchParams.get('donation_type');
    const minAmount = searchParams.get('min_amount');
    const maxAmount = searchParams.get('max_amount');
    const isPublic = searchParams.get('is_public');
    const impactGenerated = searchParams.get('impact_generated');

    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    const sortBy = searchParams.get('sortBy') || 'donation_date';
    const sortOrder = searchParams.get('sortOrder') || 'DESC';

    let whereClause = '';
    const params: any[] = [];
    let paramIndex = 1;

    if (search) {
      whereClause += ` AND (u.full_name ILIKE $${paramIndex} OR c.title ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (campaignId) {
      whereClause += ` AND d.campaign_id = $${paramIndex}`;
      params.push(parseInt(campaignId));
      paramIndex++;
    }

    if (userId) {
      whereClause += ` AND d.user_id = $${paramIndex}`;
      params.push(parseInt(userId));
      paramIndex++;
    }

    if (donationType) {
      whereClause += ` AND d.donation_type = $${paramIndex}`;
      params.push(donationType);
      paramIndex++;
    }

    if (minAmount) {
      whereClause += ` AND d.donation_amount >= $${paramIndex}`;
      params.push(parseFloat(minAmount));
      paramIndex++;
    }

    if (maxAmount) {
      whereClause += ` AND d.donation_amount <= $${paramIndex}`;
      params.push(parseFloat(maxAmount));
      paramIndex++;
    }

    if (isPublic !== null && isPublic !== '') {
      whereClause += ` AND d.is_public = $${paramIndex}`;
      params.push(isPublic === 'true');
      paramIndex++;
    }

    if (impactGenerated !== null && impactGenerated !== '') {
      whereClause += ` AND d.impact_generated = $${paramIndex}`;
      params.push(impactGenerated === 'true');
      paramIndex++;
    }

    if (startDate) {
      whereClause += ` AND d.donation_date >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      whereClause += ` AND d.donation_date <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }

    const allowedSortColumns = [
      'id', 'donation_amount', 'tip_amount', 'total_amount', 'donation_date',
      'donation_type', 'is_public', 'impact_generated', 'beneficiaries_reached',
      'donor_name', 'campaign_title', 'created_at'
    ];
    const validSortBy = allowedSortColumns.includes(sortBy) ? sortBy : 'donation_date';
    const validSortOrder = ['ASC', 'DESC'].includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';

    const donationsQuery = `
      SELECT 
        d.id,
        d.user_id,
        u.full_name as donor_name,
        u.email as donor_email,
        d.campaign_id,
        c.title as campaign_title,
        c.image as campaign_image,
        cc.name as campaign_category,
        d.donation_amount,
        d.tip_amount,
        d.total_amount,
        d.donation_type,
        d.is_public,
        d.donation_date,
        d.donated_on_behalf_of,
        d.donor_message,
        d.impact_generated,
        d.beneficiaries_reached,
        d.razorpay_payment_id,
        COALESCE(di_count.item_count, 0) as product_items_count,
        COALESCE(di_count.total_quantity, 0) as total_product_quantity,
        COALESCE(impact_count.stories_count, 0) as impact_stories_count,
        d.created_at,
        d.updated_at
      FROM donations d
      LEFT JOIN users u ON d.user_id = u.id
      LEFT JOIN campaigns c ON d.campaign_id = c.id
      LEFT JOIN campaign_categories cc ON c.category_id = cc.id
      LEFT JOIN (
        SELECT 
          donation_id,
          COUNT(*) as item_count,
          SUM(quantity) as total_quantity
        FROM donation_items
        GROUP BY donation_id
      ) di_count ON d.id = di_count.donation_id
      LEFT JOIN (
        SELECT 
          donation_id,
          COUNT(*) as stories_count
        FROM donation_impact_tracking
        GROUP BY donation_id
      ) impact_count ON d.id = impact_count.donation_id
      WHERE 1=1 ${whereClause}
      ORDER BY 
        CASE 
          WHEN '${validSortBy}' = 'donor_name' THEN u.full_name
          WHEN '${validSortBy}' = 'campaign_title' THEN c.title
          ELSE NULL
        END ${validSortOrder},
        CASE 
          WHEN '${validSortBy}' = 'donation_amount' THEN d.donation_amount
          WHEN '${validSortBy}' = 'tip_amount' THEN d.tip_amount
          WHEN '${validSortBy}' = 'total_amount' THEN d.total_amount
          WHEN '${validSortBy}' = 'beneficiaries_reached' THEN d.beneficiaries_reached
          ELSE NULL
        END ${validSortOrder},
        CASE 
          WHEN '${validSortBy}' = 'donation_date' THEN d.donation_date
          WHEN '${validSortBy}' = 'created_at' THEN d.created_at
          ELSE NULL
        END ${validSortOrder},
        d.donation_date DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    params.push(pageSize, offset);

    const countQuery = `
      SELECT COUNT(*) as total
      FROM donations d
      LEFT JOIN users u ON d.user_id = u.id
      LEFT JOIN campaigns c ON d.campaign_id = c.id
      LEFT JOIN campaign_categories cc ON c.category_id = cc.id
      WHERE 1=1 ${whereClause}
    `;

    const countParams = params.slice(0, -2);

    const statsQuery = `
      SELECT 
        COUNT(*) as total_donations,
        COALESCE(SUM(d.donation_amount), 0) as total_donation_amount,
        COALESCE(SUM(d.tip_amount), 0) as total_tip_amount,
        COALESCE(SUM(d.total_amount), 0) as total_amount,
        COUNT(CASE WHEN d.donation_type = 'direct' THEN 1 END) as direct_donations,
        COUNT(CASE WHEN d.donation_type = 'product_based' THEN 1 END) as product_based_donations,
        COUNT(CASE WHEN d.is_public = true THEN 1 END) as public_donations,
        COUNT(CASE WHEN d.impact_generated = true THEN 1 END) as donations_with_impact,
        COALESCE(SUM(d.beneficiaries_reached), 0) as total_beneficiaries_reached
      FROM donations d
      LEFT JOIN users u ON d.user_id = u.id
      LEFT JOIN campaigns c ON d.campaign_id = c.id
      LEFT JOIN campaign_categories cc ON c.category_id = cc.id
      WHERE 1=1 ${whereClause}
    `;

    const [donations, countResult, statsResult] = await Promise.all([
      SelectQuery(donationsQuery, params),
      SelectQuery(countQuery, countParams),
      SelectQuery(statsQuery, countParams)
    ]);

    const total = parseInt(countResult[0]?.total || '0');
    const totalPages = Math.ceil(total / pageSize);
    const stats = statsResult[0] || {};

    return NextResponse.json({
      donations,
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      statistics: {
        totalDonations: parseInt(stats.total_donations || '0'),
        totalDonationAmount: parseFloat(stats.total_donation_amount || '0'),
        totalTipAmount: parseFloat(stats.total_tip_amount || '0'),
        totalAmount: parseFloat(stats.total_amount || '0'),
        directDonations: parseInt(stats.direct_donations || '0'),
        productBasedDonations: parseInt(stats.product_based_donations || '0'),
        publicDonations: parseInt(stats.public_donations || '0'),
        donationsWithImpact: parseInt(stats.donations_with_impact || '0'),
        totalBeneficiariesReached: parseInt(stats.total_beneficiaries_reached || '0')
      }
    });

  } catch (error) {
    console.error('Error fetching donations:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch donations',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}


// import { NextRequest, NextResponse } from 'next/server'
// import Razorpay from 'razorpay'
// import { SelectQuery } from '@/lib/database' // Adjust import path as needed

// const razorpay = new Razorpay({
//   key_id: process.env.RAZORPAY_KEY_ID!,
//   key_secret: process.env.RAZORPAY_KEY_SECRET!,
// })

// // Function to normalize mobile number (extract last 10 digits)
// function normalizeMobileNumber(mobile: string): string {
//   // Remove all non-digit characters
//   const digitsOnly = mobile.replace(/\D/g, '');

//   // Extract last 10 digits
//   if (digitsOnly.length >= 10) {
//     return digitsOnly.slice(-10);
//   }

//   return digitsOnly; // Return as is if less than 10 digits
// }

// // Function to find or create user based on mobile number
// async function findOrCreateUser(formData: any): Promise<number> {
//   const { donorName, mobileNumber, donorCountry } = formData;

//   if (!mobileNumber || !donorName) {
//     throw new Error('Mobile number and name are required');
//   }

//   const normalizedMobile = normalizeMobileNumber(mobileNumber);

//   if (normalizedMobile.length !== 10) {
//     throw new Error('Invalid mobile number format');
//   }

//   try {
//     // First, try to find existing user by mobile number (last 10 digits)
//     const findUserQuery = `
//       SELECT id, first_name, last_name, email, mobile_no 
//       FROM users 
//       WHERE RIGHT(REGEXP_REPLACE(mobile_no, '[^0-9]', '', 'g'), 10) = $1
//       ORDER BY created_at DESC
//       LIMIT 1
//     `;

//     const existingUsers = await SelectQuery(findUserQuery, [normalizedMobile]);

//     if (existingUsers.length > 0) {
//       console.log(`Found existing user with ID: ${existingUsers[0].id} for mobile: ${normalizedMobile}`);
//       return existingUsers[0].id;
//     }

//     // If user doesn't exist, create a new one
//     console.log(`Creating new user for mobile: ${normalizedMobile}`);

//     // Split donor name into first and last name
//     const nameParts = donorName.trim().split(' ');
//     const firstName = nameParts[0] || 'Anonymous';
//     const lastName = nameParts.slice(1).join(' ') || 'Donor';

//     // Generate a dummy email since it's required
//     const dummyEmail = `donor_${normalizedMobile}@temp.dwaparyug.org`;

//     // Create new user
//     const createUserQuery = `
//       INSERT INTO users (
//         first_name, 
//         last_name, 
//         email, 
//         mobile_no, 
//         password, 
//         is_verified, 
//         role_id,
//         created_at,
//         updated_at
//       ) VALUES (
//         $1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
//       ) RETURNING id
//     `;

//     // Use a default role_id (assuming 3 is for regular users/donors)
//     const defaultRoleId = 3;
//     const dummyPassword = '$2b$10$D.if7JHKhz0OReIHOaPenOL63aN6g2BrRwAtFPACFQ/Gucq56z1IS'; // This should be hashed in production

//     const createUserParams = [
//       firstName,
//       lastName,
//       dummyEmail,
//       mobileNumber, // Store original mobile number
//       dummyPassword, // In production, hash this password
//       false, // is_verified
//       defaultRoleId
//     ];

//     const newUserResult = await SelectQuery(createUserQuery, createUserParams);

//     if (newUserResult.length === 0) {
//       throw new Error('Failed to create new user');
//     }

//     const newUserId = newUserResult[0].id;
//     console.log(`Created new user with ID: ${newUserId} for mobile: ${normalizedMobile}`);

//     return newUserId;

//   } catch (error) {
//     console.error('Error in findOrCreateUser:', error);
//     throw new Error(`User management failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
//   }
// }

// export async function POST(request: NextRequest) {
//   try {
//     const body = await request.json()
//     const {
//       cartItems,
//       customDonationId,
//       formData,
//       totalAmount,
//       donationAmount,
//       tipAmount,
//       mobileNumber
//     } = body


//     // Validation
//     if (!totalAmount || totalAmount <= 0) {
//       return NextResponse.json(
//         { error: 'Invalid total amount' },
//         { status: 400 }
//       )
//     }

//     // ✅ FIX: Extract donor info from cart items personalization if formData is empty
//     let donorInfo = formData || {};

//     if ((!donorInfo.mobileNumber || !donorInfo.donorName) && cartItems && cartItems.length > 0) {
//       // Get donor info from first cart item's personalization
//       const firstItemWithPersonalization = cartItems.find((item: any) => item.personalization);

//       if (firstItemWithPersonalization && firstItemWithPersonalization.personalization) {
//         donorInfo = {
//           ...donorInfo,
//           donorName: firstItemWithPersonalization.personalization.donorName || donorInfo.donorName,
//           mobileNumber: firstItemWithPersonalization.personalization.mobileNumber || donorInfo.mobileNumber,
//           donorCountry: firstItemWithPersonalization.personalization.donorCountry || donorInfo.donorCountry || 'IN',
//           donatedOnBehalfOf: firstItemWithPersonalization.personalization.donatedOnBehalfOf || donorInfo.donatedOnBehalfOf,
//           customMessage: firstItemWithPersonalization.personalization.customMessage || donorInfo.customMessage,
//           donationPurpose: firstItemWithPersonalization.personalization.donationPurpose || donorInfo.donationPurpose,
//           videoWishes: firstItemWithPersonalization.personalization.videoWishes || donorInfo.videoWishes,
//           instaId: firstItemWithPersonalization.personalization.instaId || donorInfo.instaId,
//           isAnonymous: firstItemWithPersonalization.personalization.isAnonymous ?? donorInfo.isAnonymous
//         };
//       }
//     }

//     // Now validate with the merged donor info
//     if (!donorInfo || !donorInfo.mobileNumber || !donorInfo.donorName) {
//       return NextResponse.json(
//         { error: 'Mobile number and donor name are required' },
//         { status: 400 }
//       )
//     }

//     if (!cartItems || (!Array.isArray(cartItems) && !donationAmount)) {
//       return NextResponse.json(
//         { error: 'Cart items or donation amount required' },
//         { status: 400 }
//       )
//     }

//     // Find or create user based on mobile number
//     let userId: number;
//     try {
//       userId = await findOrCreateUser(donorInfo); // Use donorInfo instead of formData
//     } catch (error) {
//       console.error('User management error:', error);
//       return NextResponse.json(
//         {
//           error: 'Failed to process user information',
//           details: error instanceof Error ? error.message : 'Unknown error'
//         },
//         { status: 400 }
//       )
//     }

//     // Rest of your code remains the same...
//     const donationType = cartItems && cartItems.length > 0 ? 'product_based' : 'direct'
//     let campaignId = cartItems && cartItems.length > 0 ? cartItems[0].campaignId : null

//     if (!campaignId || campaignId <= 0 && Number(customDonationId) > 0) {
//       campaignId = customDonationId
//     }

//     if (!campaignId) {
//       const defaultCampaignQuery = `
//         SELECT id FROM campaigns 
//         WHERE status = 'Active'  
//         ORDER BY created_at DESC LIMIT 1
//       `
//       const defaultCampaign = await SelectQuery(defaultCampaignQuery, [])

//       if (defaultCampaign.length > 0) {
//         campaignId = defaultCampaign[0].id
//       } else {
//         return NextResponse.json(
//           { error: 'No active campaigns found' },
//           { status: 400 }
//         )
//       }
//     }

//     // Create Razorpay order
//     const orderOptions = {
//       amount: Math.round(totalAmount * 100),
//       currency: 'INR',
//       receipt: `donation_${Date.now()}`,
//       notes: {
//         donation_type: donationType,
//         campaign_id: campaignId.toString(),
//         user_id: userId.toString(),
//         tip_amount: tipAmount.toString(),
//         donation_amount: donationAmount.toString(),
//         mobile_number: normalizeMobileNumber(donorInfo.mobileNumber) // Use donorInfo
//       }
//     }

//     const razorpayOrder = await razorpay.orders.create(orderOptions)
//     console.log("🚀 ~ POST ~ Created Razorpay order for userId:", userId)

//     const insertPaymentRequestQuery = `
//       INSERT INTO donation_payment_requests (
//         campaign_id, user_id, razorpay_order_id, amount, currency, 
//         donation_type, status
//       ) VALUES ($1, $2, $3, $4, $5, $6, $7)
//       RETURNING id
//     `

//     const paymentRequestParams = [
//       campaignId,
//       userId,
//       razorpayOrder.id,
//       totalAmount,
//       'INR',
//       donationType,
//       'created'
//     ]

//     const paymentRequestResult = await SelectQuery(insertPaymentRequestQuery, paymentRequestParams)
//     const paymentRequestId = paymentRequestResult[0].id

//     // Store merged donor info in temp data
//     const tempDataQuery = `
//       INSERT INTO donation_temp_data (
//         payment_request_id, cart_items, form_data, created_at
//       ) VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
//     `

//     await SelectQuery(tempDataQuery, [
//       paymentRequestId,
//       JSON.stringify(cartItems || []),
//       JSON.stringify(donorInfo) // Store merged donor info
//     ])

//     return NextResponse.json({
//       success: true,
//       orderId: razorpayOrder.id,
//       amount: totalAmount,
//       currency: razorpayOrder.currency,
//       paymentRequestId: paymentRequestId,
//       userId: userId,
//       key: process.env.RAZORPAY_KEY_ID
//     }, { status: 200 })

//   } catch (error) {
//     console.error('Error creating payment order:', error)

//     return NextResponse.json(
//       {
//         error: 'Failed to create payment order',
//         details: error instanceof Error ? error.message : 'Unknown error'
//       },
//       { status: 500 }
//     )
//   }
// }

// // GET - List donations with search, pagination, sorting, and filtering
// export async function GET(request: NextRequest) {
//   try {
//     const { searchParams } = new URL(request.url);

//     // Pagination parameters
//     const page = parseInt(searchParams.get('page') || '1');
//     const pageSize = parseInt(searchParams.get('pageSize') || '10');
//     const offset = (page - 1) * pageSize;

//     // Search and filter parameters
//     const search = searchParams.get('search'); // Search in donor name, campaign title
//     const campaignId = searchParams.get('campaign_id');
//     const userId = searchParams.get('user_id');
//     const donationType = searchParams.get('donation_type');
//     const minAmount = searchParams.get('min_amount');
//     const maxAmount = searchParams.get('max_amount');
//     const isPublic = searchParams.get('is_public');
//     const impactGenerated = searchParams.get('impact_generated');

//     // Date filters
//     const startDate = searchParams.get('start_date');
//     const endDate = searchParams.get('end_date');

//     // Sorting parameters
//     const sortBy = searchParams.get('sortBy') || 'donation_date';
//     const sortOrder = searchParams.get('sortOrder') || 'DESC';

//     // Build WHERE clause
//     let whereClause = '';
//     const params: any[] = [];
//     let paramIndex = 1;

//     // Global search across donor name and campaign title
//     if (search) {
//       whereClause += ` AND (u.full_name ILIKE $${paramIndex} OR c.title ILIKE $${paramIndex})`;
//       params.push(`%${search}%`);
//       paramIndex++;
//     }

//     // Specific field filters
//     if (campaignId) {
//       whereClause += ` AND d.campaign_id = $${paramIndex}`;
//       params.push(parseInt(campaignId));
//       paramIndex++;
//     }

//     if (userId) {
//       whereClause += ` AND d.user_id = $${paramIndex}`;
//       params.push(parseInt(userId));
//       paramIndex++;
//     }

//     if (donationType) {
//       whereClause += ` AND d.donation_type = $${paramIndex}`;
//       params.push(donationType);
//       paramIndex++;
//     }

//     if (minAmount) {
//       whereClause += ` AND d.donation_amount >= $${paramIndex}`;
//       params.push(parseFloat(minAmount));
//       paramIndex++;
//     }

//     if (maxAmount) {
//       whereClause += ` AND d.donation_amount <= $${paramIndex}`;
//       params.push(parseFloat(maxAmount));
//       paramIndex++;
//     }

//     if (isPublic !== null && isPublic !== '') {
//       whereClause += ` AND d.is_public = $${paramIndex}`;
//       params.push(isPublic === 'true');
//       paramIndex++;
//     }

//     if (impactGenerated !== null && impactGenerated !== '') {
//       whereClause += ` AND d.impact_generated = $${paramIndex}`;
//       params.push(impactGenerated === 'true');
//       paramIndex++;
//     }

//     if (startDate) {
//       whereClause += ` AND d.donation_date >= $${paramIndex}`;
//       params.push(startDate);
//       paramIndex++;
//     }

//     if (endDate) {
//       whereClause += ` AND d.donation_date <= $${paramIndex}`;
//       params.push(endDate);
//       paramIndex++;
//     }

//     // Validate sort column
//     const allowedSortColumns = [
//       'id', 'donation_amount', 'tip_amount', 'total_amount', 'donation_date',
//       'donation_type', 'is_public', 'impact_generated', 'beneficiaries_reached',
//       'donor_name', 'campaign_title', 'created_at'
//     ];
//     const validSortBy = allowedSortColumns.includes(sortBy) ? sortBy : 'donation_date';
//     const validSortOrder = ['ASC', 'DESC'].includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';

//     // Main query to get donations with campaign and donor details
//     const donationsQuery = `
//       SELECT 
//         d.id,
//         d.user_id,
//         u.full_name as donor_name,
//         u.email as donor_email,
//         d.campaign_id,
//         c.title as campaign_title,
//         c.image as campaign_image,
//         cc.name as campaign_category,
//         d.donation_amount,
//         d.tip_amount,
//         d.total_amount,
//         d.donation_type,
//         d.is_public,
//         d.donation_date,
//         d.donated_on_behalf_of,
//         d.donor_message,
//         d.impact_generated,
//         d.beneficiaries_reached,
//         d.razorpay_payment_id,
        
//         -- Count of donation items for product-based donations
//         COALESCE(di_count.item_count, 0) as product_items_count,
//         COALESCE(di_count.total_quantity, 0) as total_product_quantity,
        
//         -- Impact stories count
//         COALESCE(impact_count.stories_count, 0) as impact_stories_count,
        
//         d.created_at,
//         d.updated_at
        
//       FROM donations d
//       LEFT JOIN users u ON d.user_id = u.id
//       LEFT JOIN campaigns c ON d.campaign_id = c.id
//       LEFT JOIN campaign_categories cc ON c.category_id = cc.id
//       LEFT JOIN (
//         SELECT 
//           donation_id,
//           COUNT(*) as item_count,
//           SUM(quantity) as total_quantity
//         FROM donation_items
//         GROUP BY donation_id
//       ) di_count ON d.id = di_count.donation_id
//       LEFT JOIN (
//         SELECT 
//           donation_id,
//           COUNT(*) as stories_count
//         FROM donation_impact_tracking
//         GROUP BY donation_id
//       ) impact_count ON d.id = impact_count.donation_id
      
//       WHERE 1=1 ${whereClause}
//       ORDER BY 
//         CASE 
//           WHEN '${validSortBy}' = 'donor_name' THEN u.full_name
//           WHEN '${validSortBy}' = 'campaign_title' THEN c.title
//           ELSE NULL
//         END ${validSortOrder},
//         CASE 
//           WHEN '${validSortBy}' = 'donation_amount' THEN d.donation_amount
//           WHEN '${validSortBy}' = 'tip_amount' THEN d.tip_amount
//           WHEN '${validSortBy}' = 'total_amount' THEN d.total_amount
//           WHEN '${validSortBy}' = 'beneficiaries_reached' THEN d.beneficiaries_reached
//           ELSE NULL
//         END ${validSortOrder},
//         CASE 
//           WHEN '${validSortBy}' = 'donation_date' THEN d.donation_date
//           WHEN '${validSortBy}' = 'created_at' THEN d.created_at
//           ELSE NULL
//         END ${validSortOrder},
//         d.donation_date DESC
//       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
//     `;

//     params.push(pageSize, offset);

//     // Count query for pagination
//     const countQuery = `
//       SELECT COUNT(*) as total
//       FROM donations d
//       LEFT JOIN users u ON d.user_id = u.id
//       LEFT JOIN campaigns c ON d.campaign_id = c.id
//       LEFT JOIN campaign_categories cc ON c.category_id = cc.id
//       WHERE 1=1 ${whereClause}
//     `;

//     const countParams = params.slice(0, -2); // Remove limit and offset for count

//     // Summary statistics query
//     const statsQuery = `
//       SELECT 
//         COUNT(*) as total_donations,
//         COALESCE(SUM(d.donation_amount), 0) as total_donation_amount,
//         COALESCE(SUM(d.tip_amount), 0) as total_tip_amount,
//         COALESCE(SUM(d.total_amount), 0) as total_amount,
//         COUNT(CASE WHEN d.donation_type = 'direct' THEN 1 END) as direct_donations,
//         COUNT(CASE WHEN d.donation_type = 'product_based' THEN 1 END) as product_based_donations,
//         COUNT(CASE WHEN d.is_public = true THEN 1 END) as public_donations,
//         COUNT(CASE WHEN d.impact_generated = true THEN 1 END) as donations_with_impact,
//         COALESCE(SUM(d.beneficiaries_reached), 0) as total_beneficiaries_reached
//       FROM donations d
//       LEFT JOIN users u ON d.user_id = u.id
//       LEFT JOIN campaigns c ON d.campaign_id = c.id
//       LEFT JOIN campaign_categories cc ON c.category_id = cc.id
//       WHERE 1=1 ${whereClause}
//     `;

//     // Execute queries
//     const [donations, countResult, statsResult] = await Promise.all([
//       SelectQuery(donationsQuery, params),
//       SelectQuery(countQuery, countParams),
//       SelectQuery(statsQuery, countParams)
//     ]);

//     const total = parseInt(countResult[0]?.total || '0');
//     const totalPages = Math.ceil(total / pageSize);
//     const stats = statsResult[0] || {};

//     return NextResponse.json({
//       donations,
//       pagination: {
//         page,
//         pageSize,
//         total,
//         totalPages,
//         hasNext: page < totalPages,
//         hasPrev: page > 1
//       },
//       statistics: {
//         totalDonations: parseInt(stats.total_donations || '0'),
//         totalDonationAmount: parseFloat(stats.total_donation_amount || '0'),
//         totalTipAmount: parseFloat(stats.total_tip_amount || '0'),
//         totalAmount: parseFloat(stats.total_amount || '0'),
//         directDonations: parseInt(stats.direct_donations || '0'),
//         productBasedDonations: parseInt(stats.product_based_donations || '0'),
//         publicDonations: parseInt(stats.public_donations || '0'),
//         donationsWithImpact: parseInt(stats.donations_with_impact || '0'),
//         totalBeneficiariesReached: parseInt(stats.total_beneficiaries_reached || '0')
//       }
//     });

//   } catch (error) {
//     console.error('Error fetching donations:', error);
//     return NextResponse.json(
//       {
//         error: 'Failed to fetch donations',
//         details: error instanceof Error ? error.message : 'Unknown error'
//       },
//       { status: 500 }
//     );
//   }
// }