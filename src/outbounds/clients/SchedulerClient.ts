import type { IJobScheduler } from "@domains/birthday-reminder";
import type Agenda from "agenda";
import type { Job } from "agenda";

const JOB_NAME = "send-birthday-message";

export class SchedulerClient implements IJobScheduler {
	constructor(private readonly agenda: Agenda) {}

	async start(handler: (userId: string) => Promise<void>): Promise<void> {
		this.agenda.define(JOB_NAME, async (job: Job) => {
			const { userId } = job.attrs.data as { userId: string };
			await handler(userId);
		});

		await this.agenda.start();
	}

	async scheduleJob(runAt: Date, userId: string): Promise<void> {
		await this.agenda.schedule(runAt, JOB_NAME, { userId });
	}

	async cancelJob(userId: string): Promise<void> {
		await this.agenda.cancel({ name: JOB_NAME, "data.userId": userId });
	}
}
