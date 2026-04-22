import type { UserService } from "@domains/user-management";
import { createUserRouter } from "@routers/index";
import { Router } from "express";

export function createRouter(userService: UserService): Router {
	const router = Router();

	router.use("/users", createUserRouter(userService));

	return router;
}
