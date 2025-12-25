import { InsertQuery, SelectQuery } from '@/lib/database';
import { NextRequest, NextResponse } from 'next/server';

// GET all product units
export async function GET() {
  try {
    const result = await SelectQuery(
      'SELECT id, name, abbreviation FROM campaign_product_units ORDER BY name'
    );
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching product units:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product units' },
      { status: 500 }
    );
  }
}

// POST create new product unit
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, abbreviation, created_by } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Unit name is required' },
        { status: 400 }
      );
    }

    const result = await InsertQuery(
      'INSERT INTO campaign_product_units (name, abbreviation, created_by) VALUES ($1, $2, $3) RETURNING *',
      [name, abbreviation, created_by]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Error creating product unit:', error);
    return NextResponse.json(
      { error: 'Failed to create product unit' },
      { status: 500 }
    );
  }
}