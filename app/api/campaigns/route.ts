import { getClient, InsertQuery, SelectQuery } from '@/lib/database';
import { NextRequest, NextResponse } from 'next/server';

// GET all campaigns with filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const status = searchParams.get('status');
    const category_id = searchParams.get('category_id');
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || 'c.sequence';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const is_featured = searchParams.get('is_featured');

    const offset = (page - 1) * pageSize;

    let whereClause = '';
    const params: any[] = [];
    let paramIndex = 1;

    // Filter by status
    if (status) {
      whereClause += ` AND c.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    // Filter by category_id
    if (category_id) {
      whereClause += ` AND c.category_id = $${paramIndex}`;
      params.push(parseInt(category_id));
      paramIndex++;
    }

    // Filter by is_featured
    if (is_featured !== null && is_featured !== undefined) {
      whereClause += ` AND c.is_featured = $${paramIndex}`;
      params.push(parseInt(is_featured));
      paramIndex++;
    }

    // Search by name or description
    if (search) {
      whereClause += ` AND (cc.name ILIKE $${paramIndex} OR c.title ILIKE $${paramIndex} OR cc.description ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Validate sortBy and sortOrder (prevent SQL injection)
    const allowedSortFields = ['c.created_at','c.sequence', 'cc.name', 'c.status', 'c.title', 'c.total_raised', 'c.donation_goal'];
    const allowedSortOrders = ['asc', 'desc'];

    const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'c.created_at';
    const safeSortOrder = allowedSortOrders.includes(sortOrder.toLowerCase()) ? sortOrder.toUpperCase() : 'DESC';

    const campaignQuery = `
      SELECT 
        c.*,
        cc.name as category_name,
        u1.full_name as created_by_name,
        u2.full_name as updated_by_name
      FROM campaigns c
      LEFT JOIN campaign_categories cc ON c.category_id = cc.id
      LEFT JOIN users u1 ON c.created_by = u1.id
      LEFT JOIN users u2 ON c.updated_by = u2.id
      WHERE 1=1 ${whereClause}
      ORDER BY ${safeSortBy} ${safeSortOrder}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    params.push(pageSize, offset);

    // Count query for pagination
    const countQuery = `
      SELECT COUNT(c.id) as total
      FROM campaigns c
      LEFT JOIN campaign_categories cc ON c.category_id = cc.id
      LEFT JOIN users u1 ON c.created_by = u1.id
      LEFT JOIN users u2 ON c.updated_by = u2.id
      WHERE 1=1 ${whereClause}
    `;

    const countParams = params.slice(0, -2); // Remove limit and offset for count

    // Execute queries
    const [result, countResult] = await Promise.all([
      SelectQuery(campaignQuery, params),
      SelectQuery(countQuery, countParams)
    ]);

    const total = parseInt(countResult[0]?.total || '0');
    const totalPages = Math.ceil(total / pageSize);

    return NextResponse.json({
      campaigns: result,
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return NextResponse.json(
      { error: 'Failed to fetch campaigns' },
      { status: 500 }
    );
  }
}
// POST create new campaign
export async function POST(request: NextRequest) {
  const client = await getClient();

  try {
    await client.query('BEGIN');

    const body = await request.json();
    const {
      title,
      category_id,
      festival_type,
      overview,
      details,
      about_campaign,
      donation_goal,
      beneficiaries,
      image,
      mobile_banner_image,
      images_array = [],
      status = 'Draft',
      priority = 'medium',
      urgency,
      location,
      organizer,
      code,
      is_featured,
      verified = false,
      total_beneficiary = 0,
      end_date,
      created_by,
      assignedProducts = [],
      faq_questions = [],
      videoLinks = []
    } = body;

    // Validate required fields
    if (!title || !category_id || !overview || !details || !donation_goal || !image || !mobile_banner_image || !end_date) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Insert campaign
    const campaignResult = await InsertQuery(`
      INSERT INTO campaigns (
        title, category_id, festival_type, overview, details, about_campaign,
        donation_goal, image, mobile_banner_image, images_array, status, priority, urgency,
        location, organizer, verified, total_beneficiary, end_date, beneficiaries, code, is_featured, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
      RETURNING *
    `, [
      title, category_id, festival_type, overview, details, about_campaign,
      donation_goal, image, mobile_banner_image, images_array, status, priority, urgency,
      location, organizer, verified, total_beneficiary, end_date, beneficiaries,
      code, is_featured, created_by
    ]);

    const campaign = campaignResult.rows[0];

    // Insert campaign products if any
    let productIndex = 1;
    if (assignedProducts.length > 0) {
      for (const product of assignedProducts) {
        productIndex++;
        await InsertQuery(`
          INSERT INTO campaign_products (
            campaign_id, indipendent_product_id, description, price, stock, sequence, created_by
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [
          campaign.id, product.indipendent_product_id, product.description || '', product.price,
          product.stock || 0, productIndex, created_by
        ]);
      }
    }

    // Insert FAQ questions if any
    if (faq_questions.length > 0) {
      for (let i = 0; i < faq_questions.length; i++) {
        const faq = faq_questions[i];
        await InsertQuery(`
          INSERT INTO campaign_faq (
            campaign_id, question, answer, sequence, created_by
          ) VALUES ($1, $2, $3, $4, $5)
        `, [campaign.id, faq.question, faq.answer, i + 1, created_by]);
      }
    }

    // Insert video links if any
    if (videoLinks.length > 0) {
      for (let i = 0; i < videoLinks.length; i++) {
        const videoUrl = videoLinks[i];
        await InsertQuery(`
          INSERT INTO campaign_videos (
            campaign_id, video_url, sequence, created_by
          ) VALUES ($1, $2, $3, $4)
        `, [campaign.id, videoUrl, i + 1, created_by]);
      }
    }

    await client.query('COMMIT');

    return NextResponse.json(campaign, { status: 201 });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating campaign:', error);
    return NextResponse.json(
      { error: 'Failed to create campaign' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

