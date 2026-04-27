import type { IBirthdayReminderLogRepository } from "@domains/birthday-reminder/port";
import { MongoServerError } from "mongodb";
import { Schema, model, type Document } from "mongoose";

type BirthdayReminderLogDocument = { userId: string; year: number } & Document;

const birthdayReminderLogSchema = new Schema<BirthdayReminderLogDocument>(
	{
		userId: { type: String, required: true },
		year: { type: Number, required: true },
	},
	{ timestamps: true },
);

birthdayReminderLogSchema.index({ userId: 1, year: 1 }, { unique: true });

const BirthdayReminderLogModel = model<BirthdayReminderLogDocument>(
	"BirthdayReminderLog",
	birthdayReminderLogSchema,
);

export class BirthdayReminderLogRepository implements IBirthdayReminderLogRepository {
	async markSent(userId: string, year: number): Promise<boolean> {
		try {
			await BirthdayReminderLogModel.create({ userId, year });
			return true;
		} catch (err: unknown) {
			if (err instanceof MongoServerError && err.code === 11000) {
				return false;
			}
			throw err;
		}
	}
}
