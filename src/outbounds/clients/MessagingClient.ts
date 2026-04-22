import type { IMessagingClient } from "@domains/birthday-reminder";
import type { IUser } from "@domains/user-management";

export class MessagingClient implements IMessagingClient {
	sendBirthdayMessage(user: IUser): void {
		console.log(`[Birthday Reminder] Happy Birthday, ${user.name}! (sent to: ${user.email})`);
	}
}
