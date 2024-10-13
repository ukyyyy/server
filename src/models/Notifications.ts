import { model, Schema } from 'mongoose';

interface Notification {
  recipient: string;
  type: string;
  mentioned?: boolean;  // made optional
  channelId?: string;   // made optional
  lastMessageID?: string; // made optional
  sender?: any;         // consider defining a specific type for sender
  count?: number;       // made optional
}

// Notification schema
const schema = new Schema<Notification>({
  recipient: { type: String, required: true },
  type: { type: String, required: true },
  mentioned: { type: Boolean, default: false }, // default value
  channelId: { type: String },
  lastMessageID: { type: String },
  sender: { type: Schema.Types.ObjectId, ref: 'users' },
  count: { type: Number, default: 0 }, // default value
});

export const Notifications = model<Notification>('notifications', schema);
