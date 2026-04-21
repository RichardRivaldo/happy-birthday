import { Router } from "express";
import type { UserService } from "@domains/user-management/service";
import { createUserRouter } from "@routers/index";

export function createRouter(userService: UserService): Router {
	const router = Router();

	router.use("/users", createUserRouter(userService));

	return router;
}
