import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../BaseController';
import { ApiResponse } from '../../../../shared/utils/ApiResponse';
import { ICommentService } from '../../../../application/services/social/CommentService.interface';
import container from '../../../../di/container';

export class CreateCommentController extends BaseController {
  private commentService: ICommentService;

  constructor() {
    super();
    this.commentService = container.resolve<ICommentService>('commentService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.validateAuth(req);

      const comment = await this.commentService.createComment(req.user!.id, req.body);

      ApiResponse.created(res, comment, 'Comment created successfully');
    } catch (error) {
      next(error);
    }
  }
}
