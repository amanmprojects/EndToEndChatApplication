export interface User {
  _id: string;
  username: string;
  email?: string;
  profilePic?: string;
}

export interface Message {
  _id?: string;
  id?: string;
  content?: string;
  text?: string;
  roomId?: string;
  conversationId?: string;
  sender: string | User;
  createdAt?: string;
  userId?: string;
  read?: boolean;
}

export interface Room {
  _id: string;
  name: string;
  participants: string[];
  createdAt: string;
  lastMessage?: Message;
}

export interface Conversation {
  _id: string;
  participants: User[];
  messages: string[];
  lastMessage?: Message;
  createdAt: string;
  updatedAt: string;
}

export enum ChatType {
  ROOM = 'room',
  DIRECT = 'direct'
}

export interface ActiveChat {
  id: string;
  type: ChatType;
  name?: string; // For rooms
  recipient?: User; // For direct messages
  unreadCount?: number;
}