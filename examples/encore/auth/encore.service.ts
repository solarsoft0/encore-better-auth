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
import { api, APIError, Gateway, Header } from "encore.dev/api";
import { Service } from "encore.dev/service";
import { prisma } from "./database";
import { authHandler } from "encore.dev/auth";
import * as encoreAuth from "~encore/auth";

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
		}),
	],

	trustedOrigins: [
		"http://127.0.0.1:4000",
		"http://localhost:4000",
		"http://127.0.0.1:3000",
		"http://localhost:3000",
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

interface AuthParams {
	cookie: Header<"Cookie">;
}

interface AuthData {
	userID: string;
	user: any;
	session: any;
}

export const handler = authHandler<AuthParams, AuthData>(async (authdata) => {
	if (!authdata.cookie) {
		throw APIError.unauthenticated("Cookie is not provided.");
	}
	try {
		const headers = new Headers();
		headers.append('Cookie', authdata.cookie);
		const sessionResponse = await auth.api.getSession({ headers });
		const sessionData = sessionResponse;
		if (!sessionData) {
			throw APIError.unauthenticated("The session is invalid.");
		}
		return {
			userID: sessionData.user.id,
			user: sessionData.user,
			session: sessionData.session,
		};
	} catch (error) {
		throw APIError.unauthenticated("The session is invalid.");
	}
});

export const gateway = new Gateway({ authHandler: handler });

interface MeResponse {
	session: any;
	user: any;
}

export const me = api(
	{
		method: ["GET"],
		path: "/me",
		expose: true,
		auth: true,
	},
	async (): Promise<{ data: MeResponse }> => {
		const authData = encoreAuth.getAuthData();
		if (!authData) {
			throw APIError.unauthenticated("Unauthenticated");
		}
		return {
			data: {
				session: authData.session,
				user: authData.user,
			},
		};
	},
);
