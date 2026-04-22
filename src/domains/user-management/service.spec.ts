import { DuplicateError, NotFoundError } from "@shared/errors";
import type { IBirthdayScheduler } from "@domains/birthday-reminder/port";
import { ZodError } from "zod";
import type { ICreateUserPayload, IUpdateUserPayload, IUser } from "./model";
import type { IUserRepository } from "./port";
import { UserService } from "./service";

const mockUser: IUser = {
	id: "507f1f77bcf86cd799439011",
	name: "John Doe",
	email: "john@example.com",
	birthday: "1990-04-21",
	timezone: "America/New_York",
};

const validCreatePayload: ICreateUserPayload = {
	name: "John Doe",
	email: "john@example.com",
	birthday: "1990-04-21",
	timezone: "America/New_York",
};

describe("UserService", () => {
	let service: UserService;
	let mockRepository: jest.Mocked<IUserRepository>;
	let mockScheduler: jest.Mocked<IBirthdayScheduler>;

	beforeEach(() => {
		mockRepository = {
			create: jest.fn(),
			findById: jest.fn(),
			update: jest.fn(),
			delete: jest.fn(),
		};
		mockScheduler = {
			schedule: jest.fn().mockResolvedValue(undefined),
			reschedule: jest.fn().mockResolvedValue(undefined),
			cancel: jest.fn().mockResolvedValue(undefined),
		};
		service = new UserService(mockRepository, mockScheduler);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe("createUser", () => {
		it("creates a user and returns it", async () => {
			mockRepository.create.mockResolvedValue(mockUser);

			const result = await service.createUser(validCreatePayload);

			expect(result).toEqual(mockUser);
			expect(mockRepository.create).toHaveBeenCalledTimes(1);
			expect(mockRepository.create).toHaveBeenCalledWith(validCreatePayload);
			expect(mockScheduler.schedule).toHaveBeenCalledWith(mockUser);
		});

		it("throws ZodError for an empty name", async () => {
			await expect(service.createUser({ ...validCreatePayload, name: "" })).rejects.toThrow(
				ZodError,
			);

			expect(mockRepository.create).not.toHaveBeenCalled();
		});

		it("throws ZodError for an invalid email format", async () => {
			await expect(
				service.createUser({ ...validCreatePayload, email: "not-an-email" }),
			).rejects.toThrow(ZodError);

			expect(mockRepository.create).not.toHaveBeenCalled();
		});

		it("throws ZodError for a birthday in ISO 8601 MM-DD-YYYY format", async () => {
			await expect(
				service.createUser({ ...validCreatePayload, birthday: "04-21-1990" }),
			).rejects.toThrow(ZodError);

			expect(mockRepository.create).not.toHaveBeenCalled();
		});

		it("throws ZodError for a birthday with timestamp", async () => {
			await expect(
				service.createUser({ ...validCreatePayload, birthday: "1990-04-21T00:00:00Z" }),
			).rejects.toThrow(ZodError);

			expect(mockRepository.create).not.toHaveBeenCalled();
		});

		it("throws ZodError for a non-existent date", async () => {
			await expect(
				service.createUser({ ...validCreatePayload, birthday: "1990-02-30" }),
			).rejects.toThrow(ZodError);

			expect(mockRepository.create).not.toHaveBeenCalled();
		});

		it("throws ZodError for an invalid IANA timezone", async () => {
			await expect(
				service.createUser({ ...validCreatePayload, timezone: "America/Invalid" }),
			).rejects.toThrow(ZodError);

			expect(mockRepository.create).not.toHaveBeenCalled();
		});

		it("throws ZodError for a free-text timezone string", async () => {
			await expect(
				service.createUser({ ...validCreatePayload, timezone: "Eastern Standard Time" }),
			).rejects.toThrow(ZodError);

			expect(mockRepository.create).not.toHaveBeenCalled();
		});

		it("propagates a duplicate email error from the repository", async () => {
			mockRepository.create.mockRejectedValue(
				new DuplicateError(`Email '${validCreatePayload.email}' is already in use!`),
			);

			await expect(service.createUser(validCreatePayload)).rejects.toThrow(DuplicateError);
			expect(mockRepository.create).toHaveBeenCalledTimes(1);
		});
	});

	describe("getUserById", () => {
		it("returns the user when found", async () => {
			mockRepository.findById.mockResolvedValue(mockUser);

			const result = await service.getUserById(mockUser.id);

			expect(result).toEqual(mockUser);
			expect(mockRepository.findById).toHaveBeenCalledWith(mockUser.id);
		});

		it("throws an error when the user does not exist", async () => {
			mockRepository.findById.mockResolvedValue(null);

			await expect(service.getUserById("nonexistent-id")).rejects.toThrow(NotFoundError);
		});
	});

	describe("updateUser", () => {
		it("updates a user and returns the updated record", async () => {
			const updated: IUser = { ...mockUser, name: "Jane Doe" };
			mockRepository.update.mockResolvedValue(updated);

			const result = await service.updateUser(mockUser.id, { name: "Jane Doe" });

			expect(result).toEqual(updated);
			expect(mockRepository.update).toHaveBeenCalledWith(mockUser.id, { name: "Jane Doe" });
			expect(mockScheduler.reschedule).toHaveBeenCalledWith(updated);
		});

		it("accepts a partial payload with only email", async () => {
			const payload: IUpdateUserPayload = { email: "new@example.com" };
			mockRepository.update.mockResolvedValue({ ...mockUser, email: "new@example.com" });

			const result = await service.updateUser(mockUser.id, payload);

			expect(result.email).toBe("new@example.com");
		});

		it("throws ZodError for an invalid email in update", async () => {
			await expect(service.updateUser(mockUser.id, { email: "bad-email" })).rejects.toThrow(
				ZodError,
			);

			expect(mockRepository.update).not.toHaveBeenCalled();
		});

		it("throws ZodError for an invalid birthday format in update", async () => {
			await expect(
				service.updateUser(mockUser.id, { birthday: "2024/04/21" }),
			).rejects.toThrow(ZodError);

			expect(mockRepository.update).not.toHaveBeenCalled();
		});

		it("throws ZodError for an invalid timezone in update", async () => {
			await expect(
				service.updateUser(mockUser.id, { timezone: "Fake/Zone" }),
			).rejects.toThrow(ZodError);

			expect(mockRepository.update).not.toHaveBeenCalled();
		});

		it("throws an error when the user does not exist", async () => {
			mockRepository.update.mockResolvedValue(null);

			await expect(service.updateUser("nonexistent-id", { name: "Jane" })).rejects.toThrow(
				NotFoundError,
			);
		});
	});

	describe("deleteUser", () => {
		it("deletes a user successfully", async () => {
			mockRepository.delete.mockResolvedValue(true);

			await expect(service.deleteUser(mockUser.id)).resolves.toBeUndefined();
			expect(mockRepository.delete).toHaveBeenCalledWith(mockUser.id);
			expect(mockScheduler.cancel).toHaveBeenCalledWith(mockUser.id);
		});

		it("throws an error when the user does not exist", async () => {
			mockRepository.delete.mockResolvedValue(false);

			await expect(service.deleteUser("nonexistent-id")).rejects.toThrow(NotFoundError);
		});
	});
});
