import { DuplicateError } from "@shared/errors";
import type { ICreateUserPayload, IUpdateUserPayload, IUser } from "@domains/user-management/model";
import type { IUserRepository } from "@domains/user-management/port";
import { MongoServerError } from "mongodb";
import { Schema, model, type Document } from "mongoose";

type UserDocument = Omit<IUser, "id"> & Document;

const userSchema = new Schema<UserDocument>(
	{
		name: { type: String, required: true, trim: true },
		email: {
			type: String,
			required: true,
			unique: true,
			lowercase: true,
			trim: true,
		},
		birthday: { type: String, required: true },
		timezone: { type: String, required: true },
	},
	{ timestamps: true },
);

const UserModel = model<UserDocument>("User", userSchema);

function toIUser(doc: UserDocument): IUser {
	return {
		id: doc._id.toString(),
		name: doc.name,
		email: doc.email,
		birthday: doc.birthday,
		timezone: doc.timezone,
	};
}

export class UserRepository implements IUserRepository {
	async create(payload: ICreateUserPayload): Promise<IUser> {
		try {
			const doc = await UserModel.create(payload);
			return toIUser(doc);
		} catch (err: unknown) {
			if (err instanceof MongoServerError && err.code === 11000) {
				throw new DuplicateError(`Email '${payload.email}' is already in use!`);
			}
			throw err;
		}
	}

	async findById(id: string): Promise<IUser | null> {
		const doc = await UserModel.findById(id).exec();
		return doc ? toIUser(doc) : null;
	}

	async update(id: string, payload: IUpdateUserPayload): Promise<IUser | null> {
		try {
			const doc = await UserModel.findByIdAndUpdate(id, payload, { new: true }).exec();
			return doc ? toIUser(doc) : null;
		} catch (err: unknown) {
			if (err instanceof MongoServerError && err.code === 11000) {
				throw new DuplicateError(`Email '${payload.email}' is already in use!`);
			}
			throw err;
		}
	}

	async delete(id: string): Promise<boolean> {
		const result = await UserModel.findByIdAndDelete(id).exec();
		return result !== null;
	}
}
