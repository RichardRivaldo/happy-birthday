import type { ICreateUserPayload, IUpdateUserPayload, IUser } from "./model";

export interface IUserRepository {
	create(payload: ICreateUserPayload): Promise<IUser>;
	findById(id: string): Promise<IUser | null>;
	update(id: string, payload: IUpdateUserPayload): Promise<IUser | null>;
	delete(id: string): Promise<boolean>;
}
