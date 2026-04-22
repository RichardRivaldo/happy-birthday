import type { IUser, IUserRepository } from "@domains/user-management";
import { DateTime } from "luxon";
import type { IBirthdayScheduler, IJobScheduler, IMessagingClient } from "./port";

export class BirthdayReminderService implements IBirthdayScheduler {
	constructor(
		private readonly userRepository: IUserRepository,
		private readonly jobScheduler: IJobScheduler,
		private readonly messagingClient: IMessagingClient,
	) {}

	async start(): Promise<void> {
		await this.jobScheduler.start(async (userId: string) => {
			const user = await this.userRepository.findById(userId);
			if (!user) return;
			this.messagingClient.sendBirthdayMessage(user);
			await this.schedule(user);
		});
	}

	async schedule(user: IUser): Promise<void> {
		const runAt = this.getBirthdayTimestamp(user.birthday, user.timezone);
		await this.jobScheduler.scheduleJob(runAt, user.id);
	}

	async reschedule(user: IUser): Promise<void> {
		await this.cancel(user.id);
		await this.schedule(user);
	}

	async cancel(userId: string): Promise<void> {
		await this.jobScheduler.cancelJob(userId);
	}

	private getBirthdayTimestamp(birthday: string, timezone: string): Date {
		const [, month, day] = birthday.split("-").map(Number);
		const now = DateTime.now().setZone(timezone);

		let year = now.year;
		let next: DateTime;

		do {
			next = DateTime.fromObject(
				{ year, month, day, hour: 9, minute: 0, second: 0, millisecond: 0 },
				{ zone: timezone },
			);

			if (!next.isValid && month === 2 && day === 29) {
				next = DateTime.fromObject(
					{ year, month: 2, day: 28, hour: 9, minute: 0, second: 0, millisecond: 0 },
					{ zone: timezone },
				);
			}

			year++;
		} while (!next.isValid || next <= now);

		return next.toUTC().toJSDate();
	}
}
