import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../shared/utils/ApiResponse';
import { IReviewService } from '../../application/ReviewService.interface';
import container from '../../../../core/di/container';

export class CreateReviewController extends BaseController {
  private reviewService: IReviewService;

  constructor() {
    super();
    this.reviewService = container.resolve<IReviewService>('reviewService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.validateAuth(req);

      const review = await this.reviewService.createReview(req.user!.id, req.body);

      ApiResponse.created(res, review, 'Review created successfully');
    } catch (error) {
      next(error);
    }
  }
}
