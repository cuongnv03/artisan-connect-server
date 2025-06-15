export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  type: MessageType;
  attachments: string[];
  quoteRequestId?: string | null;
  productMentions?: any | null;
  isRead: boolean;
  readAt?: Date | null;
  isEdited: boolean;
  editedAt?: Date | null;
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
    role: string;
    lastSeenAt?: Date | null;
  };
  receiver: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
    role: string;
    lastSeenAt?: Date | null;
  };
  quoteRequest?: {
    id: string;
    title: string;
    status: string;
  } | null;
}

export interface CreateMessageDto {
  receiverId: string;
  content: string;
  type?: MessageType;
  attachments?: string[];
  quoteRequestId?: string;
  productMentions?: any;
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
    role: string;
    lastSeenAt?: Date | null;
  };
  lastMessage?: Message;
  unreadCount: number;
  lastActivity: Date;
}

export enum MessageType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  FILE = 'FILE',
  CUSTOM_ORDER = 'CUSTOM_ORDER',
  QUOTE_DISCUSSION = 'QUOTE_DISCUSSION',
}
