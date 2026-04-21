import "dotenv/config";

export interface IConfig {
	nodeEnv: string;
	port: number;
	dbUri: string;
}

function loadConfig(): IConfig {
	const { NODE_ENV, PORT, DB_URI } = process.env;

	if (!DB_URI) throw new Error("Missing required env var: DB_URI");

	return {
		nodeEnv: NODE_ENV ?? "development",
		port: PORT ? Number(PORT) : 3000,
		dbUri: DB_URI,
	};
}

export const config: IConfig = loadConfig();
