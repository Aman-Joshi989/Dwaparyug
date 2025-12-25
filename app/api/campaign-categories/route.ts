import { SelectQuery, InsertQuery } from '@/lib/database'; // Assuming InsertQuery is also needed for POST
import { NextRequest, NextResponse } from 'next/server';

// GET all campaign categories
export async function GET() {
  try {
    // SelectQuery already returns the array of rows, so no need for .rows here
    const result = await SelectQuery(
      'SELECT id, name, description, is_active FROM campaign_categories WHERE is_active = true ORDER BY name'
    );
    
    // 'result' is already the array of rows, so just pass 'result' directly
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching campaign categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch campaign categories' },
      { status: 500 }
    );
  }
}

// POST create new campaign category
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, is_active = true } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Category name is required' },
        { status: 400 }
      );
    }

    // Assuming SelectQuery is used and returns the inserted rows.
    const result = await SelectQuery( // Or InsertQuery if you have it
      'INSERT INTO campaign_categories (name, description, is_active) VALUES ($1, $2, $3) RETURNING *',
      [name, description, is_active]
    );

    // 'result' is an array of rows. For a single insert, you usually expect one row back.
    // So, access the first element of the array directly.
    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error('Error creating campaign category:', error);
    return NextResponse.json(
      { error: 'Failed to create campaign category' },
      { status: 500 }
    );
  }
}
