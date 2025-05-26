import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../shared/utils/ApiResponse';
import { CloudinaryService } from '../../../../core/infrastructure/storage/CloudinaryService';
import { Config } from '../../../../config/config';
import { AppError } from '../../../../core/errors/AppError';

export class UploadController extends BaseController {
  private cloudinaryService: CloudinaryService;

  constructor() {
    super();
    this.cloudinaryService = new CloudinaryService(Config.getCloudinaryConfig());
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.validateAuth(req);

      if (!req.file) {
        throw AppError.badRequest('No file uploaded');
      }

      const { folder = 'uploads', quality, width, height, format } = req.body;

      const result = await this.cloudinaryService.uploadBuffer(
        req.file.buffer,
        folder,
        req.file.mimetype.startsWith('image/') ? 'image' : 'auto',
      );

      let optimizedUrl = result.url;
      if (quality || width || height) {
        optimizedUrl = this.cloudinaryService.optimizeUrl(
          result.url,
          width ? parseInt(width) : undefined,
          height ? parseInt(height) : undefined,
          quality ? parseInt(quality) : undefined,
        );
      }

      ApiResponse.success(
        res,
        {
          url: optimizedUrl,
          publicId: result.publicId,
          format: result.format,
          width: result.width,
          height: result.height,
          resourceType: result.resourceType,
        },
        'File uploaded successfully',
      );
    } catch (error) {
      next(error);
    }
  }
}
