import { config, connectDatabase, disconnectDatabase } from "@config/index";
import { BirthdayReminderService } from "@domains/birthday-reminder";
import { UserService } from "@domains/user-management";
import { MessagingClient, SchedulerClient } from "@outbounds/clients";
import { BirthdayReminderLogRepository, UserRepository } from "@outbounds/repositories";
import { DuplicateError, NotFoundError } from "@shared/errors";
import Agenda from "agenda";
import "dotenv/config";
import express, { type NextFunction, type Request, type Response } from "express";
import { ZodError } from "zod";
import { createRouter } from "./route";

const app = express();

app.use(express.json());

async function buildApp(agenda: Agenda): Promise<void> {
	const userRepository = new UserRepository();

	const scheduler = new SchedulerClient(agenda);
	const messagingClient = new MessagingClient();
	const reminderLogRepository = new BirthdayReminderLogRepository();

	const birthdayReminderService = new BirthdayReminderService(
		userRepository,
		scheduler,
		messagingClient,
		reminderLogRepository,
	);

	await birthdayReminderService.start();

	const userService = new UserService(userRepository, birthdayReminderService);

	app.use("/api/v1", createRouter(userService));

	app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
		if (err instanceof ZodError) {
			res.status(400).json({ errors: err.flatten().fieldErrors });
			return;
		}

		if (err instanceof NotFoundError) {
			res.status(404).json({ error: err.message });
			return;
		}

		if (err instanceof DuplicateError) {
			res.status(409).json({ error: err.message });
			return;
		}

		if (err instanceof Error) {
			res.status(500).json({ error: err.message });
			return;
		}

		res.status(500).json({ error: "Internal server error!" });
	});
}

async function bootstrap(): Promise<void> {
	await connectDatabase();
	const agenda = new Agenda({ db: { address: config.dbUri } });
	await buildApp(agenda);

	app.listen(config.port, () => {
		console.log(`Server running on port ${config.port}.`);
	});

	const shutdown = (): void => {
		agenda
			.stop()
			.then(() => disconnectDatabase())
			.then(() => process.exit(0));
	};

	process.on("SIGTERM", shutdown);
	process.on("SIGINT", shutdown);
}

bootstrap().catch((err) => {
	console.error(`Failed to start server: ${err}!`);
	process.exit(1);
});

export default app;
