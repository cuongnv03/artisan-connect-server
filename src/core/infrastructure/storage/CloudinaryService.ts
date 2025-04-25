import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';
import { Logger } from '../../logging/Logger';
import { AppError } from '../../errors/AppError';

interface CloudinaryConfig {
  cloud_name: string;
  api_key: string;
  api_secret: string;
}

interface UploadResult {
  url: string;
  publicId: string;
  format: string;
  width?: number;
  height?: number;
  resourceType: string;
}

/**
 * Service for interacting with Cloudinary
 */
export class CloudinaryService {
  private logger = Logger.getInstance();

  constructor(config: CloudinaryConfig) {
    // Configure cloudinary
    cloudinary.config({
      cloud_name: config.cloud_name,
      api_key: config.api_key,
      api_secret: config.api_secret,
      secure: true,
    });
  }

  /**
   * Upload a buffer to cloudinary
   */
  async uploadBuffer(
    buffer: Buffer,
    folder: string,
    fileType: 'image' | 'video' | 'auto' = 'image',
  ): Promise<UploadResult> {
    try {
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder,
            resource_type: fileType,
          },
          (error, result) => {
            if (error) return reject(error);
            if (!result) return reject(new Error('Upload failed'));

            resolve({
              url: result.secure_url,
              publicId: result.public_id,
              format: result.format,
              width: result.width,
              height: result.height,
              resourceType: result.resource_type,
            });
          },
        );

        // Create a stream from buffer and pipe to upload stream
        const readableStream = new Readable();
        readableStream.push(buffer);
        readableStream.push(null);
        readableStream.pipe(uploadStream);
      });
    } catch (error) {
      this.logger.error(`Cloudinary upload error: ${error}`);
      throw AppError.internal('Failed to upload file', 'UPLOAD_FAILED');
    }
  }

  /**
   * Delete a file from cloudinary
   */
  async deleteFile(publicId: string, resourceType: string = 'image'): Promise<boolean> {
    try {
      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType,
      });

      return result.result === 'ok';
    } catch (error) {
      this.logger.error(`Cloudinary delete error: ${error}`);
      throw AppError.internal('Failed to delete file', 'DELETE_FAILED');
    }
  }

  /**
   * Create an optimized URL with transformations
   */
  optimizeUrl(url: string, width?: number, height?: number, quality?: number): string {
    if (!url.includes('cloudinary.com')) return url;

    const transformations = [];

    if (width || height) {
      transformations.push(`c_fit`);
      if (width) transformations.push(`w_${width}`);
      if (height) transformations.push(`h_${height}`);
    }

    if (quality) {
      transformations.push(`q_${quality}`);
    }

    if (transformations.length === 0) return url;

    // Insert transformations into URL
    const transformationString = transformations.join(',');
    return url.replace('/upload/', `/upload/${transformationString}/`);
  }
}
