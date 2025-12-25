import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;

// Optimized upload with aggressive transformations for Indian users
export async function uploadImage(fileBuffer: Buffer, fileName: string): Promise<string> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        resource_type: 'image',
        public_id: fileName,
        // Optimized transformations for performance
        transformation: [
          { width: 1200, height: 800, crop: 'limit' },
          { fetch_format: 'auto' }, // Auto WebP/AVIF
          { dpr: 'auto' }, // Auto device pixel ratio
          { flags: 'progressive' }, // Progressive JPEG loading
          { quality: '100' }, // Use 100 for maximum quality, or remove this line entirely

        ],
        // Enable responsive images
        responsive_breakpoints: [
          {
            bytes_step: 20000,
            min_width: 200,
            max_width: 1200,
            max_images: 5,
            create_derived: true
          }
        ],
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result?.secure_url || '');
        }
      }
    ).end(fileBuffer);
  });
}

// Get optimized image URL with transformations
export function getOptimizedImageUrl(
  publicId: string,
  options: {
    width?: number;
    height?: number;
    quality?: 'auto' | 'auto:good' | 'auto:best' | 'auto:eco' | 'auto:low';
    crop?: string;
    gravity?: string;
  } = {}
): string {
  const {
    width = 'auto',
    height,
    quality = '100',
    crop = 'limit',
    gravity = 'auto'
  } = options;

  const transformations = [
    'f_auto', // Auto format (WebP/AVIF)
    `q_${quality}`, // Quality
    'dpr_auto', // Auto DPR
    width !== 'auto' ? `w_${width}` : 'w_auto',
    height ? `h_${height}` : null,
    `c_${crop}`,
    `g_${gravity}`,
    'fl_progressive', // Progressive loading
  ].filter(Boolean).join(',');

  return `https://res.cloudinary.com/${process.env.CLOUDINARY_NAME}/image/upload/${transformations}/${publicId}`;
}

// Generate responsive image srcset
export function generateResponsiveSrcSet(publicId: string): {
  src: string;
  srcSet: string;
  sizes: string;
} {
  const widths = [320, 640, 768, 1024, 1280, 1536];
  const srcSet = widths
    .map(w => `${getOptimizedImageUrl(publicId, { width: w })} ${w}w`)
    .join(', ');

  return {
    src: getOptimizedImageUrl(publicId, { width: 1024 }),
    srcSet,
    sizes: '(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 1200px'
  };
}

export async function uploadMultipleImages(files: { buffer: Buffer; fileName: string }[]): Promise<string[]> {
  const uploadPromises = files.map(file => uploadImage(file.buffer, file.fileName));
  return Promise.all(uploadPromises);
}

export async function deleteImage(imageUrl: string): Promise<void> {
  try {
    const urlParts = imageUrl.split('/');
    const fileNameWithExtension = urlParts[urlParts.length - 1];
    const publicId = fileNameWithExtension.split('.')[0];

    let cleanPublicId = publicId;
    const versionIndex = urlParts.findIndex(part => part.startsWith('v'));
    if (versionIndex !== -1 && versionIndex < urlParts.length - 1) {
      cleanPublicId = urlParts.slice(versionIndex + 1).join('/').replace(/\.[^/.]+$/, '');
    }

    const result = await cloudinary.uploader.destroy(cleanPublicId);

    if (result.result === 'ok') {
      console.log(`Successfully deleted image: ${cleanPublicId}`);
    } else if (result.result === 'not found') {
      console.warn(`Image not found for deletion: ${cleanPublicId}`);
    } else {
      console.warn(`Unexpected result when deleting image: ${result.result}`);
    }
  } catch (error) {
    console.error('Error deleting image from Cloudinary:', error);
    throw new Error(`Failed to delete image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export function extractPublicId(cloudinaryUrl: string): string {
  try {
    const regex = /\/v\d+\/(.+)\./;
    const match = cloudinaryUrl.match(regex);
    return match ? match[1] : cloudinaryUrl.split('/').pop()?.split('.')[0] || '';
  } catch (error) {
    console.error('Error extracting public ID:', error);
    return '';
  }
}

export async function deleteMultipleImages(imageUrls: string[]): Promise<{
  successful: string[];
  failed: string[];
}> {
  const successful: string[] = [];
  const failed: string[] = [];

  for (const imageUrl of imageUrls) {
    try {
      await deleteImage(imageUrl);
      successful.push(imageUrl);
    } catch (error) {
      failed.push(imageUrl);
      console.error(`Failed to delete image ${imageUrl}:`, error);
    }
  }

  return { successful, failed };
}

export const processImageUpload = async (imageData: any, fileName?: string): Promise<string> => {
  if (imageData instanceof File) {
    const bytes = await imageData.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const safeFileName = fileName ||
      `product_${Date.now()}_${imageData.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
    return await uploadImage(buffer, safeFileName);
  } else if (typeof imageData === 'string' && imageData.startsWith('data:image/')) {
    const base64Data = imageData.split(',')[1];
    const buffer = Buffer.from(base64Data, 'base64');
    const extension = imageData.split(';')[0].split('/')[1] || 'jpg';
    const safeFileName = fileName ||
      `product_${Date.now()}_${Math.random().toString(36).substring(7)}.${extension}`;
    return await uploadImage(buffer, safeFileName);
  } else if (Buffer.isBuffer(imageData)) {
    const safeFileName = fileName ||
      `product_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
    return await uploadImage(imageData, safeFileName);
  }
  throw new Error('Unsupported image format');
};