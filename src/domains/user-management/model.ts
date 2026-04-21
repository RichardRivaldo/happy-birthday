export interface IUser {
	id: string;
	name: string;
	email: string;
	birthday: string;
	timezone: string;
}

export interface ICreateUserPayload {
	name: string;
	email: string;
	birthday: string;
	timezone: string;
}

export type IUpdateUserPayload = Partial<ICreateUserPayload>;
