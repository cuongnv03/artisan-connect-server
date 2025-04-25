import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../shared/utils/ApiResponse';
import { ICommentService } from '../../services/CommentService.interface';
import container from '../../../../core/di/container';

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
