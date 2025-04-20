import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from './User';

export interface IConversation extends Document {
  participants: mongoose.Types.ObjectId[] | IUser[];
  messages: mongoose.Types.ObjectId[];
  lastMessage?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const conversationSchema = new Schema(
  {
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    messages: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Message',
      },
    ],
    lastMessage: {
      type: Schema.Types.ObjectId,
      ref: 'Message',
    },
  },
  {
    timestamps: true,
  }
);

// Create index for faster lookup of conversations by participants
conversationSchema.index({ participants: 1 });

// Static method to find or create a conversation between two users
conversationSchema.statics.findOneOrCreate = async function (
  participantIds: mongoose.Types.ObjectId[]
) {
  if (!participantIds || participantIds.length !== 2) {
    throw new Error('A conversation requires exactly two participants');
  }

  // Sort participant IDs for consistent querying regardless of order
  const sortedParticipantIds = [...participantIds].sort();

  // Try to find an existing conversation with these participants
  const conversation = await this.findOne({
    participants: { $all: sortedParticipantIds },
    $expr: { $eq: [{ $size: '$participants' }, 2] }, // Ensure exactly 2 participants (for DM)
  });

  if (conversation) {
    return conversation;
  }

  // Create a new conversation if none exists
  return this.create({
    participants: sortedParticipantIds,
    messages: [],
  });
};

export interface ConversationModel extends mongoose.Model<IConversation> {
  findOneOrCreate(
    participantIds: mongoose.Types.ObjectId[]
  ): Promise<IConversation>;
}

export default mongoose.model<IConversation, ConversationModel>(
  'Conversation',
  conversationSchema
);