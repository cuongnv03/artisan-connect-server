import { Server as SocketIOServer, Socket } from 'socket.io';
import { ISocketService } from './SocketService.interface';
import { Notification } from '../../../modules/notification/models/Notification';
import { Message } from '../../../modules/messaging/models/Message';
import { Logger } from '../../logging/Logger';
import { JwtService } from '../security/JwtService';
import container from '../../di/container';

export class SocketService implements ISocketService {
  private io: SocketIOServer;
  private userSockets: Map<string, Set<string>> = new Map(); // userId -> Set of socketIds
  private socketUsers: Map<string, string> = new Map(); // socketId -> userId
  private sessionViews: Map<string, { views: Set<string>; lastAccess: number }> = new Map();
  private logger = Logger.getInstance();
  private jwtService: JwtService;

  // Cleanup intervals
  private readonly SESSION_CLEANUP_INTERVAL = 30 * 60 * 1000; // 30 minutes
  private readonly SESSION_MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours
  private cleanupTimer?: NodeJS.Timeout;

  constructor(io: SocketIOServer) {
    this.io = io;
    this.jwtService = container.resolve<JwtService>('jwtService');
    this.setupSocketServer();
    this.startCleanupScheduler();
  }

  private setupSocketServer(): void {
    this.io.use(async (socket: Socket, next) => {
      try {
        const token =
          socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

        if (!token) {
          return next(new Error('Authentication token required'));
        }

        const decoded = this.jwtService.verifyAccessToken(token);
        if (!decoded) {
          return next(new Error('Invalid authentication token'));
        }

        (socket as any).userId = decoded.userId;
        next();
      } catch (error) {
        next(new Error('Authentication failed'));
      }
    });

    this.io.on('connection', (socket: Socket) => {
      this.handleConnection(socket);
    });
  }

  private startCleanupScheduler(): void {
    // Run cleanup every 30 minutes
    this.cleanupTimer = setInterval(() => {
      this.cleanupExpiredSessions();
    }, this.SESSION_CLEANUP_INTERVAL);
  }

  private cleanupExpiredSessions(): void {
    const now = Date.now();
    let cleanedCount = 0;

    // Cleanup session views
    for (const [sessionId, sessionData] of this.sessionViews.entries()) {
      if (now - sessionData.lastAccess > this.SESSION_MAX_AGE) {
        this.sessionViews.delete(sessionId);
        cleanedCount++;
      }
    }

    // Cleanup inactive socket mappings
    for (const [socketId, userId] of this.socketUsers.entries()) {
      const socket = this.io.sockets.sockets.get(socketId);
      if (!socket) {
        // Socket không tồn tại, cleanup
        this.socketUsers.delete(socketId);

        const userSockets = this.userSockets.get(userId);
        if (userSockets) {
          userSockets.delete(socketId);
          if (userSockets.size === 0) {
            this.userSockets.delete(userId);
          }
        }
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      this.logger.info(`Cleaned up ${cleanedCount} expired sessions/sockets`);
    }
  }

  handleConnection(socket: Socket): void {
    const userId = (socket as any).userId;

    if (!userId) {
      socket.disconnect();
      return;
    }

    this.addUserSocket(userId, socket.id);
    this.updateUserStatus(userId, 'online');

    this.logger.info(`User ${userId} connected with socket ${socket.id}`);

    // Join user to their personal room
    socket.join(`user:${userId}`);

    // Handle disconnection
    socket.on('disconnect', () => {
      this.handleDisconnection(socket);
    });

    // Handle joining chat rooms
    socket.on('join-chat', (data: { roomId: string }) => {
      this.joinRoom(socket.id, data.roomId);
      socket.emit('joined-chat', { roomId: data.roomId });
    });

    // Handle leaving chat rooms
    socket.on('leave-chat', (data: { roomId: string }) => {
      this.leaveRoom(socket.id, data.roomId);
      socket.emit('left-chat', { roomId: data.roomId });
    });

    // Handle typing indicators
    socket.on('typing', (data: { roomId: string; isTyping: boolean }) => {
      this.updateTypingStatus(data.roomId, userId, data.isTyping);
    });

    // Handle real-time message events
    socket.on('message-read', (data: { messageId: string }) => {
      // Emit to sender that message was read
      socket.broadcast.emit('message-read-update', data);
    });
  }

  handleDisconnection(socket: Socket): void {
    const userId = (socket as any).userId;

    if (userId) {
      this.removeUserSocket(userId, socket.id);

      // Check if user has other active connections
      const userSockets = this.getUserSockets(userId);
      if (userSockets.length === 0) {
        this.updateUserStatus(userId, 'offline');
      }

      this.logger.info(`User ${userId} disconnected from socket ${socket.id}`);
    }
  }

  addUserSocket(userId: string, socketId: string): void {
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }
    this.userSockets.get(userId)!.add(socketId);
    this.socketUsers.set(socketId, userId);
  }

  removeUserSocket(userId: string, socketId: string): void {
    const userSocketSet = this.userSockets.get(userId);
    if (userSocketSet) {
      userSocketSet.delete(socketId);
      if (userSocketSet.size === 0) {
        this.userSockets.delete(userId);
      }
    }
    this.socketUsers.delete(socketId);
  }

  getUserSockets(userId: string): string[] {
    const socketSet = this.userSockets.get(userId);
    return socketSet ? Array.from(socketSet) : [];
  }

  // Enhanced session tracking with TTL-like behavior
  trackSessionView(sessionId: string, postId: string): boolean {
    const now = Date.now();

    if (!this.sessionViews.has(sessionId)) {
      this.sessionViews.set(sessionId, {
        views: new Set(),
        lastAccess: now,
      });
    }

    const sessionData = this.sessionViews.get(sessionId)!;
    sessionData.lastAccess = now;

    const isUnique = !sessionData.views.has(postId);
    if (isUnique) {
      sessionData.views.add(postId);
    }

    return isUnique;
  }

  async sendNotification(userId: string, notification: Notification): Promise<void> {
    try {
      await this.broadcastToUser(userId, 'notification', notification);
      this.logger.debug(`Notification sent to user ${userId}: ${notification.type}`);
    } catch (error) {
      this.logger.error(`Error sending notification to user ${userId}: ${error}`);
    }
  }

  async updateUnreadCount(userId: string, count: number): Promise<void> {
    try {
      await this.broadcastToUser(userId, 'unread-count', { count });
    } catch (error) {
      this.logger.error(`Error updating unread count for user ${userId}: ${error}`);
    }
  }

  async sendMessage(receiverId: string, message: Message): Promise<void> {
    try {
      await this.broadcastToUser(receiverId, 'new-message', message);
      this.logger.debug(`Message sent to user ${receiverId}`);
    } catch (error) {
      this.logger.error(`Error sending message to user ${receiverId}: ${error}`);
    }
  }

  async updateTypingStatus(roomId: string, userId: string, isTyping: boolean): Promise<void> {
    try {
      this.sendToRoom(roomId, 'typing-status', {
        userId,
        isTyping,
        timestamp: new Date(),
      });
    } catch (error) {
      this.logger.error(`Error updating typing status: ${error}`);
    }
  }

  async updateUserStatus(userId: string, status: 'online' | 'offline'): Promise<void> {
    try {
      this.broadcast('user-status', { userId, status, timestamp: new Date() });
    } catch (error) {
      this.logger.error(`Error updating user status: ${error}`);
    }
  }

  joinRoom(socketId: string, roomId: string): void {
    const socket = this.io.sockets.sockets.get(socketId);
    if (socket) {
      socket.join(roomId);
      this.logger.debug(`Socket ${socketId} joined room ${roomId}`);
    }
  }

  leaveRoom(socketId: string, roomId: string): void {
    const socket = this.io.sockets.sockets.get(socketId);
    if (socket) {
      socket.leave(roomId);
      this.logger.debug(`Socket ${socketId} left room ${roomId}`);
    }
  }

  sendToRoom(roomId: string, event: string, data: any): void {
    this.io.to(roomId).emit(event, data);
  }

  broadcast(event: string, data: any): void {
    this.io.emit(event, data);
  }

  async broadcastToUser(userId: string, event: string, data: any): Promise<void> {
    const userSockets = this.getUserSockets(userId);

    if (userSockets.length === 0) {
      this.logger.debug(`User ${userId} is not connected`);
      return;
    }

    userSockets.forEach((socketId) => {
      const socket = this.io.sockets.sockets.get(socketId);
      if (socket) {
        socket.emit(event, data);
      }
    });
  }

  // Cleanup on shutdown
  public async shutdown(): Promise<void> {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    this.userSockets.clear();
    this.socketUsers.clear();
    this.sessionViews.clear();
  }
}
