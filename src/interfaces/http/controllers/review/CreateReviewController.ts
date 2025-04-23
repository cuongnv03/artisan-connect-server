import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../BaseController';
import { ApiResponse } from '../../../../shared/utils/ApiResponse';
import { IReviewService } from '../../../../application/services/review/ReviewService.interface';
import container from '../../../../di/container';

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
