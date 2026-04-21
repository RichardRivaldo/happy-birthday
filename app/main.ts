import { config, connectDatabase } from "@config/index";
import { UserService } from "@domains/user-management/service";
import { UserRepository } from "@outbounds/repositories/index";
import "dotenv/config";
import express, { type NextFunction, type Request, type Response } from "express";
import { ZodError } from "zod";
import { createRouter } from "./route";

const app = express();

app.use(express.json());

function buildApp(): void {
	const userRepository = new UserRepository();
	const userService = new UserService(userRepository);

	app.use("/api/v1", createRouter(userService));

	app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
		if (err instanceof ZodError) {
			res.status(400).json({ errors: err.flatten().fieldErrors });
			return;
		}

		if (err instanceof Error) {
			const isNotFound = err.message.includes("not found");
			res.status(isNotFound ? 404 : 500).json({ error: err.message });
			return;
		}

		res.status(500).json({ error: "Internal server error!" });
	});
}

async function bootstrap(): Promise<void> {
	await connectDatabase();
	buildApp();

	app.listen(config.port, () => {
		console.log(`Server running on port ${config.port}.`);
	});
}

bootstrap().catch((err) => {
	console.error(`Failed to start server: ${err}!`);
	process.exit(1);
});

export default app;
