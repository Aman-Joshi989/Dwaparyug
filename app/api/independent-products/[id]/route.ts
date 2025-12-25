import { SelectQuery } from '@/lib/database';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params;
    
    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }
    
    if (!/^\d+$/.test(productId)) {
      return NextResponse.json(
        { error: 'Invalid product ID format' },
        { status: 400 }
      );
    }
    
    const productQuery = `
      SELECT 
        id, name, description, price, unit_id, image, min_qty, max_qty,
        increment_count, is_flexible_increment_count, allows_personalization,
        status, created_by, updated_by, created_at, updated_at
      FROM indipendent_products 
      WHERE id = $1
    `;
    
    const result = await SelectQuery(productQuery, [parseInt(productId)]);
    
    if (!result.length) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      product: result[0]
    });
    
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}