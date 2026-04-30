import mongoose, { Model, Schema } from "mongoose";

type UserDocument = mongoose.Document & {
  discordId: string;
  centralWebState?: {
    roster?: unknown;
    tasks?: unknown;
    settings?: unknown;
    completion?: unknown;
    updatedAt?: number | null;
  };
};

const raidGateSchema = new Schema(
  {
    difficulty: { type: String, default: "Normal" },
    completedDate: { type: Number, default: null }
  },
  { _id: false }
);

const assignedRaidSchema = new Schema({}, { _id: false, strict: false });

const characterTaskSchema = new Schema(
  {
    id: { type: String, required: true },
    completions: { type: Number, default: 0 },
    completionDate: { type: Number, default: null }
  },
  { _id: false }
);

const sideTaskSchema = new Schema(
  {
    taskId: { type: String, required: true },
    name: { type: String, required: true, maxlength: 60 },
    reset: { type: String, enum: ["daily", "weekly"], required: true },
    completed: { type: Boolean, default: false },
    lastResetAt: { type: Number, default: 0 },
    createdAt: { type: Number, default: () => Date.now() }
  },
  { _id: false }
);

const characterSchema = new Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    class: { type: String, required: true },
    itemLevel: { type: Number, required: true, min: 0 },
    combatScore: { type: String, default: "" },
    isGoldEarner: { type: Boolean, default: false },
    bibleSerial: { type: String, default: null },
    bibleCid: { type: Number, default: null },
    bibleRid: { type: Number, default: null },
    publicLogDisabled: { type: Boolean, default: false },
    assignedRaids: {
      armoche: { type: assignedRaidSchema, default: () => ({}) },
      kazeros: { type: assignedRaidSchema, default: () => ({}) },
      serca: { type: assignedRaidSchema, default: () => ({}) }
    },
    tasks: { type: [characterTaskSchema], default: [] },
    sideTasks: { type: [sideTaskSchema], default: [] },
    raidGates: { type: [raidGateSchema], default: [] }
  },
  { _id: false }
);

const accountSchema = new Schema(
  {
    accountName: { type: String, required: true },
    characters: { type: [characterSchema], default: [] },
    lastRefreshedAt: { type: Number, default: null },
    lastRefreshAttemptAt: { type: Number, default: null }
  },
  { _id: false }
);

const webStateSchema = new Schema(
  {
    roster: { type: Schema.Types.Mixed, default: null },
    tasks: { type: Schema.Types.Mixed, default: null },
    settings: { type: Schema.Types.Mixed, default: null },
    completion: { type: Schema.Types.Mixed, default: null },
    updatedAt: { type: Number, default: null }
  },
  { _id: false, strict: false }
);

const userSchema = new Schema(
  {
    discordId: { type: String, required: true, unique: true, index: true },
    discordUsername: { type: String, default: "" },
    discordGlobalName: { type: String, default: "" },
    discordDisplayName: { type: String, default: "" },
    weeklyResetKey: { type: String, default: "" },
    accounts: { type: [accountSchema], default: [] },
    tasks: {
      type: [
        {
          name: { type: String, required: true },
          type: { type: String, required: true },
          timesToComplete: { type: Number, default: 1 },
          id: { type: String, required: true }
        }
      ],
      default: []
    },
    autoManageEnabled: { type: Boolean, default: false },
    lastAutoManageAttemptAt: { type: Number, default: null },
    lastAutoManageSyncAt: { type: Number, default: null },
    lastPrivateLogNudgeAt: { type: Number, default: null },
    centralWebState: { type: webStateSchema, default: () => ({}) }
  },
  {
    timestamps: true,
    optimisticConcurrency: true
  }
);

userSchema.index({ weeklyResetKey: 1 });
userSchema.index({ "accounts.characters.itemLevel": 1 }, { name: "raid_check_item_level_scan" });
userSchema.index({ "accounts.lastRefreshedAt": 1 }, { name: "raid_check_refresh_scan" });
userSchema.index(
  {
    autoManageEnabled: 1,
    lastAutoManageSyncAt: 1,
    lastAutoManageAttemptAt: 1
  },
  {
    name: "auto_manage_daily_scan",
    partialFilterExpression: { autoManageEnabled: true }
  }
);

export const User =
  (mongoose.models.User as Model<UserDocument>) || mongoose.model<UserDocument>("User", userSchema);

export async function saveWithRetry<T>(operation: () => Promise<T>, maxAttempts = 5): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      const maybe = error as { name?: string; code?: number };
      const isVersion = maybe?.name === "VersionError";
      const isDupKey = maybe?.code === 11000;
      if (!isVersion && !isDupKey) {
        throw error;
      }
      if (attempt === maxAttempts) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, 40 * attempt));
    }
  }
  throw lastError instanceof Error ? lastError : new Error("saveWithRetry failed");
}
