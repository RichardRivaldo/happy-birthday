import mongoose from "mongoose";
import { config } from "./env";

export async function connectDatabase(): Promise<void> {
	await mongoose.connect(config.dbUri);
	console.log(`Connected to the database at ${config.dbUri}.`);
}

export async function disconnectDatabase(): Promise<void> {
	await mongoose.disconnect();
	console.log(`Successfully disconnected from the database!`);
}
