import { NextRequest, NextResponse } from 'next/server';
import { uploadImage, uploadMultipleImages } from '@/lib/cloudinary';

// Helper function to process different image formats
const processImageUpload = async (imageData: any, fileName?: string): Promise<string> => {
  
  if (imageData instanceof File) {
    // Handle File object
    const bytes = await imageData.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const safeFileName = fileName || 
      `campaign_${Date.now()}_${imageData.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
    return await uploadImage(buffer, safeFileName);
  } else if (typeof imageData === 'string' && imageData.startsWith('data:image/')) {
    // Handle base64 string
    const base64Data = imageData.split(',')[1];
    const buffer = Buffer.from(base64Data, 'base64');
    const extension = imageData.split(';')[0].split('/')[1] || 'jpg';
    const safeFileName = fileName || 
      `campaign_${Date.now()}_${Math.random().toString(36).substring(7)}.${extension}`;
    return await uploadImage(buffer, safeFileName);
  } else if (Buffer.isBuffer(imageData)) {
    // Handle Buffer directly
    const safeFileName = fileName || 
      `campaign_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
    return await uploadImage(imageData, safeFileName);
  }
  
  throw new Error('Unsupported image format');
};

// POST upload single or multiple images via form data
export async function POST(request: NextRequest) {
  try {
    console.log("🚀 ~ GET ~ process.env.CLOUDINARY_NAME:", process.env.CLOUDINARY_NAME)
    console.log("🚀 ~ GET ~ process.env.CLOUDINARYCLOUDINARY_UPLOAD_PRESET_NAME:", process.env.CLOUDINARY_UPLOAD_PRESET)
    const contentType = request.headers.get('content-type');
    
    if (contentType?.includes('multipart/form-data')) {
      // Handle form data upload (File objects)
      const formData = await request.formData();
      const files = formData.getAll('files') as File[];
      
      if (!files || files.length === 0) {
        return NextResponse.json(
          { error: 'No files provided' },
          { status: 400 }
        );
      }

      if (files.length === 1) {
        const file = files[0];
        const imageUrl = await processImageUpload(file);
        return NextResponse.json({ imageUrl });
      } else {
        const imageUrls = await Promise.all(
          files.map((file, index) => 
            processImageUpload(file, `campaign_${Date.now()}_${index}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`)
          )
        );
        return NextResponse.json({ imageUrls });
      }
    } else if (contentType?.includes('application/json')) {
      // Handle JSON upload (base64 strings)
      const body = await request.json();
      const { images, type = 'single' } = body;
      
      if (!images) {
        return NextResponse.json(
          { error: 'No image data provided' },
          { status: 400 }
        );
      }

      if (type === 'single' || !Array.isArray(images)) {
        const imageData = Array.isArray(images) ? images[0] : images;
        const imageUrl = await processImageUpload(imageData);
        return NextResponse.json({ imageUrl });
      } else {
        const imageUrls = await Promise.all(
          images.map((imageData: any, index: number) => 
            processImageUpload(imageData, `campaign_${Date.now()}_${index}`)
          )
        );
        return NextResponse.json({ imageUrls });
      }
    }
    
    return NextResponse.json(
      { error: 'Unsupported content type' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error uploading images:', error);
    return NextResponse.json(
      { error: 'Failed to upload images', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// PUT upload images by replacing existing ones
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { campaignId, bannerImage, additionalImages } = body;
    
    if (!campaignId) {
      return NextResponse.json(
        { error: 'Campaign ID is required' },
        { status: 400 }
      );
    }

    const results: { bannerImageUrl?: string; additionalImageUrls?: string[] } = {};

    // Process banner image if provided
    if (bannerImage) {
      results.bannerImageUrl = await processImageUpload(bannerImage, `campaign_${campaignId}_banner`);
    }

    // Process additional images if provided
    if (additionalImages && Array.isArray(additionalImages)) {
      results.additionalImageUrls = await Promise.all(
        additionalImages.map((imageData: any, index: number) => 
          processImageUpload(imageData, `campaign_${campaignId}_additional_${index}`)
        )
      );
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error updating campaign images:', error);
    return NextResponse.json(
      { error: 'Failed to update images', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// GET upload configuration (for frontend)
export async function GET() {
    
  return NextResponse.json({
    cloudName: process.env.CLOUDINARY_NAME,
    uploadPreset: process.env.CLOUDINARY_UPLOAD_PRESET,
    supportedFormats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    maxFileSize: 10 * 1024 * 1024, // 10MB
    maxFiles: 10
  });
}