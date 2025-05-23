import { Notification } from '../../modules/notification/models/Notification';
import { Message } from '../../modules/messaging/models/Message';

export interface ISocketService {
  // Connection management
  handleConnection(socket: any): void;
  handleDisconnection(socket: any): void;

  // User management
  addUserSocket(userId: string, socketId: string): void;
  removeUserSocket(userId: string, socketId: string): void;
  getUserSockets(userId: string): string[];

  // Notification methods
  sendNotification(userId: string, notification: Notification): Promise<void>;
  updateUnreadCount(userId: string, count: number): Promise<void>;

  // Messaging methods
  sendMessage(receiverId: string, message: Message): Promise<void>;
  updateTypingStatus(roomId: string, userId: string, isTyping: boolean): Promise<void>;
  updateUserStatus(userId: string, status: 'online' | 'offline'): Promise<void>;

  // Room management
  joinRoom(socketId: string, roomId: string): void;
  leaveRoom(socketId: string, roomId: string): void;
  sendToRoom(roomId: string, event: string, data: any): void;

  // Broadcast methods
  broadcast(event: string, data: any): void;
  broadcastToUser(userId: string, event: string, data: any): Promise<void>;
}
