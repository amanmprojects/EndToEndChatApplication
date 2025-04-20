"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const conversationSchema = new mongoose_1.Schema({
    participants: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
    ],
    messages: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'Message',
        },
    ],
    lastMessage: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Message',
    },
}, {
    timestamps: true,
});
// Create index for faster lookup of conversations by participants
conversationSchema.index({ participants: 1 });
// Static method to find or create a conversation between two users
conversationSchema.statics.findOneOrCreate = function (participantIds) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!participantIds || participantIds.length !== 2) {
            throw new Error('A conversation requires exactly two participants');
        }
        // Sort participant IDs for consistent querying regardless of order
        const sortedParticipantIds = [...participantIds].sort();
        // Try to find an existing conversation with these participants
        const conversation = yield this.findOne({
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
    });
};
exports.default = mongoose_1.default.model('Conversation', conversationSchema);
