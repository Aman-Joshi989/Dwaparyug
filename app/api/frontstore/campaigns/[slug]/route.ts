// app/api/frontstore/campaigns/[slug]/route.ts

import { SelectQuery } from '@/lib/database';
import { NextRequest, NextResponse } from 'next/server';
import { titleToSlug } from '@/lib/slug-helper';

// GET single campaign with all related data by slug
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    console.log('Received slug:', slug);

    // Get campaign details using slug
    // The SQL removes special characters and converts to slug format, matching your titleToSlug function
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
      WHERE LOWER(
        TRIM(
          REGEXP_REPLACE(
            REGEXP_REPLACE(c.title, '[^a-zA-Z0-9\\s-]', '', 'g'),
            '\\s+', '-', 'g'
          )
        )
      ) = LOWER($1)
    `, [slug]);

    console.log('Campaign result:', campaignResult);

    if (!campaignResult || campaignResult.length === 0) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }

    const campaign = campaignResult[0];
    const campaignId = campaign.id;

    // Get campaign products
    const productsResult = await SelectQuery(`
      SELECT cp.*, ip.image, ip.min_tat, ip.max_tat, ip.name 
      FROM campaign_products cp
      INNER JOIN indipendent_products ip ON ip.id = cp.indipendent_product_id
      WHERE campaign_id = $1   
      ORDER BY sequence 
    `, [campaignId]);

    // Get campaign FAQ
    const faqResult = await SelectQuery(`
      SELECT question, answer 
      FROM campaign_faq 
      WHERE campaign_id = $1 AND is_active = true
      ORDER BY sequence
    `, [campaignId]);

    // Get campaign videos
    const videosResult = await SelectQuery(`
      SELECT video_url 
      FROM campaign_videos 
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
      { error: 'Failed to fetch campaign', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}