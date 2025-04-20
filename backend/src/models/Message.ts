import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage extends Document {
  sender: mongoose.Types.ObjectId;
  content: string;
  conversationId?: mongoose.Types.ObjectId;
  roomId?: string;
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema(
  {
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: 'Conversation',
    },
    roomId: {
      type: String,
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure the message has either a conversationId (for DMs) or a roomId (for group chats)
messageSchema.pre('save', function (next) {
  if (!this.conversationId && !this.roomId) {
    return next(new Error('Message must belong to either a conversation or a room'));
  }
  next();
});

// Create indexes for faster queries
messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index({ roomId: 1, createdAt: -1 });
messageSchema.index({ sender: 1 });

export default mongoose.model<IMessage>('Message', messageSchema);