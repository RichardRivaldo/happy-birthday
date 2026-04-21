import { NotFoundError } from "@shared/errors";
import type { ICreateUserPayload, IUpdateUserPayload, IUser } from "./model";
import type { IUserRepository } from "./port";
import { createUserSchema, updateUserSchema } from "./schema";

export class UserService {
	constructor(private readonly userRepository: IUserRepository) {}

	async createUser(payload: ICreateUserPayload): Promise<IUser> {
		createUserSchema.parse(payload);
		return this.userRepository.create(payload);
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
		return user;
	}

	async deleteUser(id: string): Promise<void> {
		const deleted = await this.userRepository.delete(id);
		if (!deleted) throw new NotFoundError(`User with id '${id}' cannot be found!`);
	}
}
