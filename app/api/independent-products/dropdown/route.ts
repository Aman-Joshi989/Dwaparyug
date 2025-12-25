import { SelectQuery } from '@/lib/database';
import { NextRequest, NextResponse } from 'next/server';

// GET - Get products for dropdown/select options
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Optional filters
    const status = searchParams.get('status') || 'Active';
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '100');
    const unitId = searchParams.get('unit_id');
    const priceRange = searchParams.get('price_range'); // 'low', 'medium', 'high'
    
    // Build WHERE clause
    let whereClause = '';
    const params: any[] = [];
    let paramIndex = 1;
    
    // Filter by status (default to Active)
    if (status) {
      whereClause += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    
    // Search in name
    if (search) {
      whereClause += ` AND name ILIKE $${paramIndex}`;
      params.push(`%${search}%`);
      paramIndex++;
    }
    
    // Filter by unit
    if (unitId) {
      whereClause += ` AND unit_id = $${paramIndex}`;
      params.push(parseInt(unitId));
      paramIndex++;
    }
    
    // Filter by price range
    if (priceRange) {
      switch (priceRange.toLowerCase()) {
        case 'low':
          whereClause += ` AND price <= 100`;
          break;
        case 'medium':
          whereClause += ` AND price > 100 AND price <= 500`;
          break;
        case 'high':
          whereClause += ` AND price > 500`;
          break;
      }
    }
    
    // Query for dropdown options
    const dropdownQuery = `
      SELECT 
        id,
        name,
        price,
        unit_id,
        image,
        status,
        CONCAT(name, ' - $', price::text) as display_text
      FROM indipendent_products 
      WHERE 1=1 ${whereClause}
      ORDER BY name ASC
      LIMIT $${paramIndex}
    `;
    
    params.push(limit);
    
    const result = await SelectQuery(dropdownQuery, params);
    
    // Format for different dropdown needs
    const formattedResults = result.map(product => ({
      value: product.id,
      label: product.display_text,
      price: product.price,
      image: product.image,
      unit_id: product.unit_id,
      status: product.status,
      // Additional formats for different UI libraries
      text: product.name,
      id: product.id,
      name: product.name
    }));
    
    // Get summary stats for the filtered results
    const statsQuery = `
      SELECT 
        COUNT(*) as total_products,
        AVG(price) as avg_price,
        MIN(price) as min_price,
        MAX(price) as max_price,
        COUNT(CASE WHEN status = 'Active' THEN 1 END) as active_count,
        COUNT(CASE WHEN status = 'Inactive' THEN 1 END) as inactive_count
      FROM indipendent_products 
      WHERE 1=1 ${whereClause.replace(`LIMIT $${paramIndex}`, '')}
    `;
    
    const statsParams = params.slice(0, -1); // Remove limit for stats
    const stats = await SelectQuery(statsQuery, statsParams);
    
    return NextResponse.json({
      options: formattedResults,
      stats: stats[0],
      meta: {
        total_returned: formattedResults.length,
        limit_applied: limit,
        filters_applied: {
          status,
          search: search || null,
          unit_id: unitId || null,
          price_range: priceRange || null
        }
      }
    });
    
  } catch (error) {
    console.error('Error fetching product dropdown options:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product options', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}