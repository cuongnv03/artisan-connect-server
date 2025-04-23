import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../BaseController';
import { ApiResponse } from '../../../../shared/utils/ApiResponse';
import { ICommentService } from '../../../../application/services/social/CommentService.interface';
import container from '../../../../di/container';

export class DeleteCommentController extends BaseController {
  private commentService: ICommentService;

  constructor() {
    super();
    this.commentService = container.resolve<ICommentService>('commentService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.validateAuth(req);

      const { id } = req.params;
      await this.commentService.deleteComment(id, req.user!.id);

      ApiResponse.success(res, null, 'Comment deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}
