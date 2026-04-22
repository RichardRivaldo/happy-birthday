import { NotFoundError } from "@shared/errors";
import type { IBirthdayScheduler } from "@domains/birthday-reminder/port";
import type { ICreateUserPayload, IUpdateUserPayload, IUser } from "./model";
import type { IUserRepository } from "./port";
import { createUserSchema, updateUserSchema } from "./schema";

export class UserService {
	constructor(
		private readonly userRepository: IUserRepository,
		private readonly birthdayScheduler: IBirthdayScheduler,
	) {}

	async createUser(payload: ICreateUserPayload): Promise<IUser> {
		createUserSchema.parse(payload);
		const user = await this.userRepository.create(payload);
		await this.birthdayScheduler.schedule(user);
		return user;
	}

	async getUserById(id: string): Promise<IUser> {
		const user = await this.userRepository.findById(id);
		if (!user) throw new NotFoundError(`User with id '${id}' cannot be found!`);
		return user;
	}

	async updateUser(id: string, payload: IUpdateUserPayload): Promise<IUser> {
		updateUserSchema.parse(payload);
		const user = await this.userRepository.update(id, payload);
		if (!user) throw new NotFoundError(`User with id '${id}' cannot be found!`);
		if (payload.birthday !== undefined || payload.timezone !== undefined) {
			await this.birthdayScheduler.reschedule(user);
		}
		return user;
	}

	async deleteUser(id: string): Promise<void> {
		const deleted = await this.userRepository.delete(id);
		if (!deleted) throw new NotFoundError(`User with id '${id}' cannot be found!`);
		await this.birthdayScheduler.cancel(id);
	}
}
