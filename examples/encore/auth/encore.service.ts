import { prismaAdapter } from "better-auth/adapters/prisma";
import { apiKey, username } from "better-auth/plugins";
import { encoreBetterAuth } from "encore-better-auth";
import { currentRequest } from "encore.dev";
import { api } from "encore.dev/api";
import { Service } from "encore.dev/service";
import { prisma } from "./database";

// ensure to export auth.
export const auth = encoreBetterAuth({
	currentRequest: currentRequest,
	database: prismaAdapter(prisma, {
		provider: "sqlite", // or "mysql", "postgresql", ...etc
	}),
	emailAndPassword: {
		enabled: true,
	},
	basePath: "/auth",
	plugins: [
		username(),
		apiKey({
			rateLimit: {
				enabled: true,
				timeWindow: 1000 * 60 * 60 * 24, // 1 day
				maxRequests: 10, // 10 requests per day
			},
		}),
	],
	generateRoutes: true,
	wrapResponse: true, // must be true.
});

// Encore will consider this directory and all its subdirectories as part of the "users" service.
// https://encore.dev/docs/ts/primitives/services
export default new Service("auth", {
	middlewares: [...auth.middlewares],
});

type TriggerResponse = {
	data: {
		ok: boolean;
	};
};
export const trigger = api(
	{ expose: true, method: "GET", path: "/auth/trigger/ok" },
	async (): Promise<TriggerResponse> => {
		return auth.routeHandlers.ok();
	},
);
