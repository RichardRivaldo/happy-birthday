import { Router, type NextFunction, type Request, type Response } from "express";
import type { UserService } from "@domains/user-management/service";

export function createUserRouter(userService: UserService): Router {
	const router = Router();

	router.post("/", async (req: Request, res: Response, next: NextFunction) => {
		try {
			const user = await userService.createUser(req.body);
			res.status(201).json(user);
		} catch (err) {
			next(err);
		}
	});

	router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
		try {
			const user = await userService.getUserById(req.params.id);
			res.status(200).json(user);
		} catch (err) {
			next(err);
		}
	});

	router.patch("/:id", async (req: Request, res: Response, next: NextFunction) => {
		try {
			const user = await userService.updateUser(req.params.id, req.body);
			res.status(200).json(user);
		} catch (err) {
			next(err);
		}
	});

	router.delete("/:id", async (req: Request, res: Response, next: NextFunction) => {
		try {
			await userService.deleteUser(req.params.id);
			res.status(204).send();
		} catch (err) {
			next(err);
		}
	});

	return router;
}
