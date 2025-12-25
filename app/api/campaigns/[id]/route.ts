import { DeleteQuery, getClient, InsertQuery, SelectQuery, UpdateQuery } from '@/lib/database';
import { NextRequest, NextResponse } from 'next/server';

// GET single campaign with all related data
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const campaignId = parseInt(id);

    // Get campaign details
    const campaignResult = await SelectQuery(`
      SELECT 
        c.*,
        cc.name as category_name,
        u1.full_name as created_by_name,
        u2.full_name as updated_by_name
      FROM campaigns c
      LEFT JOIN campaign_categories cc ON c.category_id = cc.id
      LEFT JOIN users u1 ON c.created_by = u1.id
      LEFT JOIN users u2 ON c.updated_by = u2.id
      WHERE c.id = $1
    `, [campaignId]);

    if (campaignResult?.length === 0) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }

    const campaign = campaignResult[0];

    // Get campaign products
    const productsResult = await SelectQuery(`
      SELECT cp.*, ip.image ,ip.min_tat, ip.max_tat, ip.name FROM campaign_products cp
      INNER JOIN indipendent_products ip ON ip.id = cp.indipendent_product_id
      WHERE campaign_id = $1   
      ORDER BY sequence 
    `, [campaignId]);

    // Get campaign FAQ
    const faqResult = await SelectQuery(`
      SELECT question, answer FROM campaign_faq 
      WHERE campaign_id = $1 AND is_active = true
      ORDER BY sequence
    `, [campaignId]);

    // Get campaign videos
    const videosResult = await SelectQuery(`
      SELECT video_url FROM campaign_videos 
      WHERE campaign_id = $1 AND is_active = true
      ORDER BY sequence
    `, [campaignId]);

    // Combine all data
    const campaignData = {
      ...campaign,
      assignedProducts: productsResult,
      faq_questions: faqResult,
      videoLinks: videosResult?.map((v: any) => v.video_url)
    };

    return NextResponse.json(campaignData);
  } catch (error) {
    console.error('Error fetching campaign:', error);
    return NextResponse.json(
      { error: 'Failed to fetch campaign' },
      { status: 500 }
    );
  }
}


// PUT update campaign
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const client = await getClient();

  try {
    await client.query('BEGIN');

    const { id } = await params;
    const campaignId = parseInt(id);
    const body = await request.json();
    const {
      title,
      category_id,
      festival_type,
      sequence,
      overview,
      details,
      about_campaign,
      donation_goal,
      beneficiaries,
      image,
      mobile_banner_image,
      images_array = [],
      status,
      priority,
      urgency,
      location,
      organizer,
      verified,
      code,
      is_featured,
      total_beneficiary,
      end_date,
      updated_by,
      assignedProducts = [],
      faq_questions = [],
      videoLinks = []
    } = body;

    // Update campaign
    const campaignResult = await UpdateQuery(`
      UPDATE campaigns SET
        title = $1, category_id = $2, festival_type = $3, overview = $4,
        details = $5, about_campaign = $6, donation_goal = $7, image = $8,
        mobile_banner_image = $9, images_array = $10, status = $11, priority = $12, urgency = $13,
        location = $14, organizer = $15, verified = $16, total_beneficiary = $17,
        end_date = $18, updated_by = $19, beneficiaries = $20,
        code = $21, is_featured = $22,sequence =$23, updated_at = CURRENT_TIMESTAMP
      WHERE id = $24
      RETURNING *
    `, [
      title, category_id, festival_type, overview, details, about_campaign,
      donation_goal, image, mobile_banner_image, images_array, status, priority, urgency,
      location, organizer, verified, total_beneficiary, end_date, updated_by, beneficiaries, code,
      is_featured,sequence, campaignId
    ]);

    if (campaignResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }

    // Delete existing products, FAQ, and videos
    await DeleteQuery('DELETE FROM campaign_products WHERE campaign_id = $1', [campaignId]);
    await DeleteQuery('DELETE FROM campaign_faq WHERE campaign_id = $1', [campaignId]);
    await DeleteQuery('DELETE FROM campaign_videos WHERE campaign_id = $1', [campaignId]);

    // Insert updated products
    let productIndex = 1;
    if (assignedProducts.length > 0) {
      for (const product of assignedProducts) {
        productIndex++;
        await InsertQuery(`
          INSERT INTO campaign_products (
            campaign_id, indipendent_product_id, description, price, stock, sequence, created_by
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [
          campaignId, product.indipendent_product_id, product.description || '', product.price,
          product.stock || 0, productIndex, updated_by
        ]);
      }
    }

    // Insert updated FAQ
    if (faq_questions.length > 0) {
      for (let i = 0; i < faq_questions.length; i++) {
        const faq = faq_questions[i];
        await InsertQuery(`
          INSERT INTO campaign_faq (
            campaign_id, question, answer, sequence, created_by
          ) VALUES ($1, $2, $3, $4, $5)
        `, [campaignId, faq.question, faq.answer, i + 1, updated_by]);
      }
    }

    // Insert updated videos
    if (videoLinks.length > 0) {
      for (let i = 0; i < videoLinks.length; i++) {
        const videoUrl = videoLinks[i];
        await InsertQuery(`
          INSERT INTO campaign_videos (
            campaign_id, video_url, sequence, created_by
          ) VALUES ($1, $2, $3, $4)
        `, [campaignId, videoUrl, i + 1, updated_by]);
      }
    }

    await client.query('COMMIT');

    return NextResponse.json(campaignResult.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating campaign:', error);
    return NextResponse.json(
      { error: 'Failed to update campaign' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

// DELETE campaign
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const campaignId = parseInt(id);

    // Check if campaign has donations
    const donationsResult = await SelectQuery(
      'SELECT COUNT(*) as count FROM donations WHERE campaign_id = $1',
      [campaignId]
    );

    if (parseInt(donationsResult[0]?.count) > 0) {
      return NextResponse.json(
        { error: 'Cannot delete campaign with existing donations' },
        { status: 400 }
      );
    }

    // Delete campaign (CASCADE will handle related records)
    const result = await DeleteQuery(
      'DELETE FROM campaigns WHERE id = $1 RETURNING *',
      [campaignId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Campaign deleted successfully' });
  } catch (error) {
    console.error('Error deleting campaign:', error);
    return NextResponse.json(
      { error: 'Failed to delete campaign' },
      { status: 500 }
    );
  }
}