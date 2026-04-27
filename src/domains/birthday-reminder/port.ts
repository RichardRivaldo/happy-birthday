import type { IUser } from "@domains/user-management";

export interface IBirthdayScheduler {
	schedule(user: IUser): Promise<void>;
	reschedule(user: IUser): Promise<void>;
	cancel(userId: string): Promise<void>;
}

export interface IJobScheduler {
	start(handler: (userId: string) => Promise<void>): Promise<void>;
	scheduleJob(runAt: Date, userId: string): Promise<void>;
	cancelJob(userId: string): Promise<void>;
}

export interface IMessagingClient {
	sendBirthdayMessage(user: IUser): void;
}

export interface IBirthdayReminderLogRepository {
	markSent(userId: string, year: number): Promise<boolean>;
}
