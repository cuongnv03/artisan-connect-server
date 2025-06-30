import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../../shared/utils/ApiResponse';
import { IProductService } from '../../../services/ProductService.interface';
import { AppError } from '../../../../../core/errors/AppError';
import container from '../../../../../core/di/container';

export class AdminProductController extends BaseController {
  private productService: IProductService;

  constructor() {
    super();
    this.productService = container.resolve<IProductService>('productService');
  }

  // Get all products for admin
  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.validateAuth(req);

      if (req.user!.role !== 'ADMIN') {
        throw AppError.forbidden('Only admins can access this resource');
      }

      const options = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 20,
        search: req.query.search as string,
        status: req.query.status as string,
        sortBy: (req.query.sortBy as string) || 'createdAt',
        sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
      };

      const products = await this.productService.getProducts(options);

      ApiResponse.success(res, products, 'Products retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  // Update product status
  public updateProductStatus = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      this.validateAuth(req);

      if (req.user!.role !== 'ADMIN') {
        throw AppError.forbidden('Only admins can update product status');
      }

      const { id } = req.params;
      const { status } = req.body;

      // Get product first to get seller info
      const product = await this.productService.getProductById(id);
      if (!product) {
        throw AppError.notFound('Product not found');
      }

      // Use artisan's update method but with admin privileges
      const updatedProduct = await this.productService.updateProduct(id, product.seller!.id, {
        status,
      });

      ApiResponse.success(res, updatedProduct, 'Product status updated successfully');
    } catch (error) {
      next(error);
    }
  };

  // Delete product
  public deleteProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      this.validateAuth(req);

      if (req.user!.role !== 'ADMIN') {
        throw AppError.forbidden('Only admins can delete products');
      }

      const { id } = req.params;

      // Get product first to get seller info
      const product = await this.productService.getProductById(id);
      if (!product) {
        throw AppError.notFound('Product not found');
      }

      await this.productService.deleteProduct(id, product.seller!.id);

      ApiResponse.success(res, null, 'Product deleted successfully');
    } catch (error) {
      next(error);
    }
  };
}
