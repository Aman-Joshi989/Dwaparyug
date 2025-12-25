import { SelectQuery } from '@/lib/database';
import { uploadImage, deleteImage, processImageUpload } from '@/lib/cloudinary';
import { NextRequest, NextResponse } from 'next/server';

// Helper function to process image upload

// GET - List products with search, pagination, sorting
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Pagination parameters
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const offset = (page - 1) * pageSize;
    
    // Search parameters
    const search = searchParams.get('search');
    const name = searchParams.get('name');
    const status = searchParams.get('status');
    const unitId = searchParams.get('unit_id');
    const minPrice = searchParams.get('min_price');
    const maxPrice = searchParams.get('max_price');
    const createdBy = searchParams.get('created_by');
    
    // Date filters
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    
    // Sorting parameters
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'DESC';
    
    // Build WHERE clause
    let whereClause = '';
    const params: any[] = [];
    let paramIndex = 1;
    
    // Global search across name and description
    if (search) {
      whereClause += ` AND (name ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }
    
    // Specific field searches
    if (name) {
      whereClause += ` AND name ILIKE $${paramIndex}`;
      params.push(`%${name}%`);
      paramIndex++;
    }
    
    if (status) {
      whereClause += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    
    if (unitId) {
      whereClause += ` AND unit_id = $${paramIndex}`;
      params.push(parseInt(unitId));
      paramIndex++;
    }
    
    if (minPrice) {
      whereClause += ` AND price >= $${paramIndex}`;
      params.push(parseFloat(minPrice));
      paramIndex++;
    }
    
    if (maxPrice) {
      whereClause += ` AND price <= $${paramIndex}`;
      params.push(parseFloat(maxPrice));
      paramIndex++;
    }
    
    if (createdBy) {
      whereClause += ` AND created_by = $${paramIndex}`;
      params.push(parseInt(createdBy));
      paramIndex++;
    }
    
    if (startDate) {
      whereClause += ` AND created_at >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }
    
    if (endDate) {
      whereClause += ` AND created_at <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }
    
    // Validate sort column
    const allowedSortColumns = [
      'id', 'name', 'price', 'status', 'created_at', 'updated_at', 
      'min_qty', 'max_qty', 'unit_id'
    ];
    const validSortBy = allowedSortColumns.includes(sortBy) ? sortBy : 'created_at';
    const validSortOrder = ['ASC', 'DESC'].includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';
    
    // Main query to get products
    const productsQuery = `
      SELECT 
        id, name, description, price, unit_id, image, min_qty, max_qty,
        increment_count, is_flexible_increment_count, allows_personalization,
        status, created_by, updated_by, created_at, updated_at
      FROM indipendent_products 
      WHERE 1=1 ${whereClause}
      ORDER BY ${validSortBy} ${validSortOrder}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    params.push(pageSize, offset);
    
    // Count query for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM indipendent_products 
      WHERE 1=1 ${whereClause}
    `;
    
    const countParams = params.slice(0, -2); // Remove limit and offset for count
    
    // Execute queries
    const [products, countResult] = await Promise.all([
      SelectQuery(productsQuery, params),
      SelectQuery(countQuery, countParams)
    ]);
    
    const total = parseInt(countResult[0]?.total || '0');
    const totalPages = Math.ceil(total / pageSize);
    
    return NextResponse.json({
      products,
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
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// POST - Create new product
export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type');
    let body: any;
    let imageUrl: string | null = null;
    
    if (contentType?.includes('multipart/form-data')) {
      // Handle form data with file upload
      const formData = await request.formData();
      
      // Extract image if present
      const imageFile = formData.get('image') as File;
      if (imageFile) {
        imageUrl = await processImageUpload(imageFile, `product_${Date.now()}_${imageFile.name.replace(/[^a-zA-Z0-9.]/g, '_')}`);
      }
      
      // Extract other form fields
      body = {
        name: formData.get('name') as string,
        description: formData.get('description') as string,
        price: parseFloat(formData.get('price') as string),
        unit_id: formData.get('unit_id') ? parseInt(formData.get('unit_id') as string) : null,
        min_qty: formData.get('min_qty') ? parseInt(formData.get('min_qty') as string) : 1,
        max_qty: formData.get('max_qty') ? parseInt(formData.get('max_qty') as string) : null,
        increment_count: formData.get('increment_count') ? parseInt(formData.get('increment_count') as string) : 1,
        is_flexible_increment_count: formData.get('is_flexible_increment_count') === 'true',
        allows_personalization: formData.get('allows_personalization') === 'true',
        min_tat: formData.get('min_tat') ? parseInt(formData.get('min_tat') as string) : null,
        max_tat: formData.get('max_tat') ? parseInt(formData.get('max_tat') as string) : null,
        status: formData.get('status') as string || 'Active',
        created_by: formData.get('created_by') ? parseInt(formData.get('created_by') as string) : null,
      };
    } else {
      // Handle JSON request
      body = await request.json();
      
      // Process base64 image if present
      if (body.image && typeof body.image === 'string') {
        imageUrl = await processImageUpload(body.image, `product_${Date.now()}`);
      }
    }
    
    // Validation
    if (!body.name || !body.price) {
      return NextResponse.json(
        { error: 'Name and price are required fields' },
        { status: 400 }
      );
    }
    
    // Validate status
    const validStatuses = ['Active', 'Inactive'];
    if (body.status && !validStatuses.includes(body.status)) {
      return NextResponse.json(
        { error: 'Status must be either Active or Inactive' },
        { status: 400 }
      );
    }
    
    // Insert query
    const insertQuery = `
      INSERT INTO indipendent_products (
        name, description, price, unit_id, image, min_qty, max_qty,
        increment_count, is_flexible_increment_count, allows_personalization,
        min_tat, max_tat, status, created_by, updated_by
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $14
      ) RETURNING *
    `;
    
    const params = [
      body.name,
      body.description || null,
      body.price,
      body.unit_id || null,
      imageUrl,
      body.min_qty || 1,
      body.max_qty || null,
      body.increment_count || 1,
      body.is_flexible_increment_count !== false,
      body.allows_personalization !== false,
      body.min_tat || null,
      body.max_tat || null,
      body.status || 'Active',
      body.created_by || null
    ];
    
    const result = await SelectQuery(insertQuery, params);
    
    return NextResponse.json({
      message: 'Product created successfully',
      product: result[0]
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: 'Failed to create product', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// PUT - Update product
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('id');
    
    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }
    
    // Get existing product to handle image deletion
    const existingProductQuery = 'SELECT * FROM indipendent_products WHERE id = $1';
    const existingProduct = await SelectQuery(existingProductQuery, [parseInt(productId)]);
    
    if (!existingProduct.length) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }
    
    const contentType = request.headers.get('content-type');
    let body: any;
    let imageUrl: string | null = existingProduct[0].image;
    
    if (contentType?.includes('multipart/form-data')) {
      const formData = await request.formData();
      
      // Handle new image upload
      const imageFile = formData.get('image') as File;
      if (imageFile) {
        // Delete old image if exists
        if (existingProduct[0].image) {
          try {
            await deleteImage(existingProduct[0].image);
          } catch (error) {
            console.warn('Failed to delete old image:', error);
          }
        }
        imageUrl = await processImageUpload(imageFile, `product_${productId}_${imageFile.name.replace(/[^a-zA-Z0-9.]/g, '_')}`);
      }
      
      body = {
        name: formData.get('name') as string,
        description: formData.get('description') as string,
        price: parseFloat(formData.get('price') as string),
        unit_id: formData.get('unit_id') ? parseInt(formData.get('unit_id') as string) : null,
        min_qty: formData.get('min_qty') ? parseInt(formData.get('min_qty') as string) : 1,
        max_qty: formData.get('max_qty') ? parseInt(formData.get('max_qty') as string) : null,
        increment_count: formData.get('increment_count') ? parseInt(formData.get('increment_count') as string) : 1,
        is_flexible_increment_count: formData.get('is_flexible_increment_count') === 'true',
        allows_personalization: formData.get('allows_personalization') === 'true',
        min_tat: formData.get('min_tat') ? parseInt(formData.get('min_tat') as string) : null,
        max_tat: formData.get('max_tat') ? parseInt(formData.get('max_tat') as string) : null,
        status: formData.get('status') as string,
        updated_by: formData.get('updated_by') ? parseInt(formData.get('updated_by') as string) : null,
      };
    } else {
      body = await request.json();
      
      // Handle new base64 image
      if (body.image && typeof body.image === 'string' && body.image.startsWith('data:image/')) {
        if (existingProduct[0].image) {
          try {
            await deleteImage(existingProduct[0].image);
          } catch (error) {
            console.warn('Failed to delete old image:', error);
          }
        }
        imageUrl = await processImageUpload(body.image, `product_${productId}`);
      } else if (body.image === null || body.image === '') {
        // User wants to remove image
        if (existingProduct[0].image) {
          try {
            await deleteImage(existingProduct[0].image);
          } catch (error) {
            console.warn('Failed to delete old image:', error);
          }
        }
        imageUrl = null;
      }
    }
    
    // Validation
    if (body.status && !['Active', 'Inactive'].includes(body.status)) {
      return NextResponse.json(
        { error: 'Status must be either Active or Inactive' },
        { status: 400 }
      );
    }
    
    // Build update query dynamically
    const updateFields: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;
    
    if (body.name !== undefined) {
      updateFields.push(`name = $${paramIndex}`);
      params.push(body.name);
      paramIndex++;
    }
    
    if (body.description !== undefined) {
      updateFields.push(`description = $${paramIndex}`);
      params.push(body.description);
      paramIndex++;
    }
    
    if (body.price !== undefined) {
      updateFields.push(`price = $${paramIndex}`);
      params.push(body.price);
      paramIndex++;
    }
    
    if (body.unit_id !== undefined) {
      updateFields.push(`unit_id = $${paramIndex}`);
      params.push(body.unit_id);
      paramIndex++;
    }
    
    // Always update image field (even if null)
    updateFields.push(`image = $${paramIndex}`);
    params.push(imageUrl);
    paramIndex++;
    
    if (body.min_qty !== undefined) {
      updateFields.push(`min_qty = $${paramIndex}`);
      params.push(body.min_qty);
      paramIndex++;
    }
    
    if (body.max_qty !== undefined) {
      updateFields.push(`max_qty = $${paramIndex}`);
      params.push(body.max_qty);
      paramIndex++;
    }
    
    if (body.increment_count !== undefined) {
      updateFields.push(`increment_count = $${paramIndex}`);
      params.push(body.increment_count);
      paramIndex++;
    }
    
    if (body.is_flexible_increment_count !== undefined) {
      updateFields.push(`is_flexible_increment_count = $${paramIndex}`);
      params.push(body.is_flexible_increment_count);
      paramIndex++;
    }
    
    if (body.allows_personalization !== undefined) {
      updateFields.push(`allows_personalization = $${paramIndex}`);
      params.push(body.allows_personalization);
      paramIndex++;
    }
    
    if (body.min_tat !== undefined) {
      updateFields.push(`min_tat = $${paramIndex}`);
      params.push(body.min_tat);
      paramIndex++;
    }
    
    if (body.max_tat !== undefined) {
      updateFields.push(`max_tat = $${paramIndex}`);
      params.push(body.max_tat);
      paramIndex++;
    }
    
    if (body.status !== undefined) {
      updateFields.push(`status = $${paramIndex}`);
      params.push(body.status);
      paramIndex++;
    }
    
    if (body.updated_by !== undefined) {
      updateFields.push(`updated_by = $${paramIndex}`);
      params.push(body.updated_by);
      paramIndex++;
    }
    
    // Always update the updated_at timestamp
    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    
    if (updateFields.length === 1) { // Only updated_at field
      return NextResponse.json(
        { error: 'No fields provided for update' },
        { status: 400 }
      );
    }
    
    // Add product ID parameter
    params.push(parseInt(productId));
    
    const updateQuery = `
      UPDATE indipendent_products 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;
    
    const result = await SelectQuery(updateQuery, params);
    
    return NextResponse.json({
      message: 'Product updated successfully',
      product: result[0]
    });
    
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { error: 'Failed to update product', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete product
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('id');
    
    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }
    
    // Get product to delete associated image
    const productQuery = 'SELECT * FROM indipendent_products WHERE id = $1';
    const product = await SelectQuery(productQuery, [parseInt(productId)]);
    
    if (!product.length) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }
    
    // Delete image from Cloudinary if exists
    if (product[0].image) {
      try {
        await deleteImage(product[0].image);
      } catch (error) {
        console.warn('Failed to delete image from Cloudinary:', error);
        // Continue with database deletion even if image deletion fails
      }
    }
    
    // Delete from database
    const deleteQuery = 'DELETE FROM indipendent_products WHERE id = $1 RETURNING *';
    const result = await SelectQuery(deleteQuery, [parseInt(productId)]);
    
    return NextResponse.json({
      message: 'Product deleted successfully',
      product: result[0]
    });
    
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { error: 'Failed to delete product', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}