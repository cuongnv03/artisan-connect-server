export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  type: MessageType;
  metadata?: any;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MessageWithUsers extends Message {
  sender: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
  };
  receiver: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
  };
}

export interface CreateMessageDto {
  receiverId: string;
  content: string;
  type?: MessageType;
  metadata?: any;
}

export interface MessageQueryOptions {
  page?: number;
  limit?: number;
  conversationWith?: string;
  type?: MessageType;
  isRead?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface Conversation {
  participantId: string;
  participant: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
  };
  lastMessage?: Message;
  unreadCount: number;
  lastActivity: Date;
}

export enum MessageType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  CUSTOM_ORDER = 'CUSTOM_ORDER',
  QUOTE_DISCUSSION = 'QUOTE_DISCUSSION',
}
