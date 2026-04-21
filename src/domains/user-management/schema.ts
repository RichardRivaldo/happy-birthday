import { isValidTimezone } from "@shared/timezones";
import { z } from "zod";

export const createUserSchema = z.object({
	name: z.string().min(1, "Name is required!"),
	email: z.string().email("Invalid email address!"),
	birthday: z.string().date("Birthday must be in ISO 8601 date format (YYYY-MM-DD)!"),
	timezone: z.string().refine(isValidTimezone, {
		message: "Invalid IANA timezone!",
	}),
});

export const updateUserSchema = createUserSchema.partial();
