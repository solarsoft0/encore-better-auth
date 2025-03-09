import { prismaAdapter } from "better-auth/adapters/prisma";
import {
	anonymous,
	apiKey,
	magicLink,
	phoneNumber,
	username,
} from "better-auth/plugins";
import { encoreBetterAuth } from "encore-better-auth";
import { currentRequest } from "encore.dev";
import { APIError, Gateway } from "encore.dev/api";
import { Service } from "encore.dev/service";
import { prisma } from "./database";
import { authHandler } from "encore.dev/auth";

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
		magicLink({
			sendMagicLink: async ({ email, token, url }, request) => {
				// send email to user
			},
		}),
		phoneNumber({
			sendOTP: ({ phoneNumber, code }, request) => {
				// Implement sending OTP code via SMS
			},
		}),
		anonymous({
			emailDomainName: "example.com",
		}),
		apiKey({
			rateLimit: {
				enabled: true,
				timeWindow: 1000 * 60 * 60 * 24, // 1 day
				maxRequests: 10, // 10 requests per day
			},
		})
	],
	// socialProviders: {
	// 	facebook: {
	// 		clientId: "",
	// 		clientSecret: "",
	// 	},
	// 	google: {
	// 		clientId: "",
	// 		clientSecret: "",
	// 	},
	// },
	generateRoutes: true,
	wrapResponse: true, // must be true.
});

// Encore will consider this directory and all its subdirectories as part of the "users" service.
// https://encore.dev/docs/ts/primitives/services
export default new Service("auth", {
	middlewares: [...auth.middlewares],
});

interface AuthParams {}

interface AuthData {
	userID: string;
	user: any;
	session: any;
}

export const handler = authHandler<AuthParams, AuthData>(async (_) => {
	try {
		const session = await auth.routeHandlers.getSession();
		const data = session.data;
		if (!data) {
			throw new Error();
		}
		return {
			userID: data.user.id,
			user: data.user,
			session: data.session,
		};
	} catch (error) {
		throw APIError.unauthenticated("The session is invalid.");
	}
});

export const gateway = new Gateway({ authHandler: handler });
