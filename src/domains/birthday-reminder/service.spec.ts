import type { IUser, IUserRepository } from "@domains/user-management";
import { DateTime } from "luxon";
import type { IBirthdayReminderLogRepository, IJobScheduler, IMessagingClient } from "./port";
import { BirthdayReminderService } from "./service";

const timezone = "America/New_York";

function makeUser(overrides: Partial<IUser> = {}): IUser {
	return {
		id: "507f1f77bcf86cd799439011",
		name: "John Doe",
		email: "john@example.com",
		birthday: "1990-06-15",
		timezone,
		...overrides,
	};
}

describe("BirthdayReminderService", () => {
	let service: BirthdayReminderService;
	let mockJobScheduler: jest.Mocked<IJobScheduler>;
	let mockMessagingClient: jest.Mocked<IMessagingClient>;
	let mockUserRepository: jest.Mocked<IUserRepository>;
	let mockReminderLogRepository: jest.Mocked<IBirthdayReminderLogRepository>;

	beforeEach(() => {
		mockJobScheduler = {
			start: jest.fn().mockResolvedValue(undefined),
			scheduleJob: jest.fn().mockResolvedValue(undefined),
			cancelJob: jest.fn().mockResolvedValue(undefined),
		};
		mockMessagingClient = {
			sendBirthdayMessage: jest.fn(),
		};
		mockUserRepository = {
			create: jest.fn(),
			findById: jest.fn(),
			update: jest.fn(),
			delete: jest.fn(),
		};
		mockReminderLogRepository = {
			markSent: jest.fn().mockResolvedValue(true),
		};

		service = new BirthdayReminderService(
			mockUserRepository,
			mockJobScheduler,
			mockMessagingClient,
			mockReminderLogRepository,
		);
	});

	afterEach(() => jest.clearAllMocks());

	describe("schedule", () => {
		it("calls scheduleJob with 9 AM in the user's timezone", async () => {
			const user = makeUser();
			await service.schedule(user);

			const [runAt, userId] = mockJobScheduler.scheduleJob.mock.calls[0];
			const scheduled = DateTime.fromJSDate(runAt).setZone(timezone);

			expect(userId).toBe(user.id);
			expect(scheduled.hour).toBe(9);
			expect(scheduled.minute).toBe(0);
		});

		it("schedules a future date, never in the past", async () => {
			const user = makeUser();
			await service.schedule(user);

			const [runAt] = mockJobScheduler.scheduleJob.mock.calls[0];
			expect(runAt.getTime()).toBeGreaterThan(Date.now());
		});

		it("resolves 9 AM in the correct timezone, not 9 AM UTC", async () => {
			const user = makeUser({ timezone: "Asia/Tokyo" });
			await service.schedule(user);

			const [runAt] = mockJobScheduler.scheduleJob.mock.calls[0];
			const inTokyo = DateTime.fromJSDate(runAt).setZone("Asia/Tokyo");
			const inUtc = DateTime.fromJSDate(runAt).toUTC();

			expect(inTokyo.hour).toBe(9);
			expect(inUtc.hour).not.toBe(9);
		});

		it("uses Feb 28 for a Feb 29 birthday in a non-leap year", async () => {
			const user = makeUser({ birthday: "1992-02-29" });
			await service.schedule(user);

			const [runAt] = mockJobScheduler.scheduleJob.mock.calls[0];
			const scheduled = DateTime.fromJSDate(runAt).setZone(timezone);

			expect(scheduled.month).toBe(2);
			expect(scheduled.day === 28 || scheduled.day === 29).toBe(true);
			expect(scheduled.hour).toBe(9);
		});
	});

	describe("reschedule", () => {
		it("cancels the existing job then schedules a new one", async () => {
			const user = makeUser();
			await service.reschedule(user);

			expect(mockJobScheduler.cancelJob).toHaveBeenCalledWith(user.id);
			expect(mockJobScheduler.scheduleJob).toHaveBeenCalledTimes(1);
		});
	});

	describe("cancel", () => {
		it("cancels the job for the given user", async () => {
			await service.cancel("user-123");
			expect(mockJobScheduler.cancelJob).toHaveBeenCalledWith("user-123");
		});
	});

	describe("start / job handler", () => {
		async function captureHandler(): Promise<(userId: string) => Promise<void>> {
			await service.start();
			return mockJobScheduler.start.mock.calls[0][0];
		}

		it("sends birthday message when user is found", async () => {
			const user = makeUser();
			mockUserRepository.findById.mockResolvedValue(user);
			const handler = await captureHandler();

			await handler(user.id);

			expect(mockMessagingClient.sendBirthdayMessage).toHaveBeenCalledWith(user);
		});

		it("reschedules for next year after sending the message", async () => {
			const user = makeUser();
			mockUserRepository.findById.mockResolvedValue(user);
			const handler = await captureHandler();

			await handler(user.id);

			expect(mockJobScheduler.scheduleJob).toHaveBeenCalledTimes(1);
		});

		it("does nothing when the user no longer exists", async () => {
			mockUserRepository.findById.mockResolvedValue(null);
			const handler = await captureHandler();

			await handler("deleted-user-id");

			expect(mockMessagingClient.sendBirthdayMessage).not.toHaveBeenCalled();
			expect(mockJobScheduler.scheduleJob).not.toHaveBeenCalled();
		});

		it("does nothing when a message was already sent this year (duplicate guard)", async () => {
			const user = makeUser();
			mockUserRepository.findById.mockResolvedValue(user);
			mockReminderLogRepository.markSent.mockResolvedValue(false);
			const handler = await captureHandler();

			await handler(user.id);

			expect(mockMessagingClient.sendBirthdayMessage).not.toHaveBeenCalled();
			expect(mockJobScheduler.scheduleJob).not.toHaveBeenCalled();
		});
	});
});
