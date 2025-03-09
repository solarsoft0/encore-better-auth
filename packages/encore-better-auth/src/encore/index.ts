import type { Endpoint } from "better-auth";
import type { EncoreBetterAuthOptions, EncoreEndpointFn, EncoreRouteHandlers } from "../types";
import { createEncoreAPIHandler } from "./handler";
import { APIError } from 'encore.dev/api';
export const createEncoreHandlers = <T extends Record<string, Endpoint<any>>>(
	apiEndpoints: T,
	options: EncoreBetterAuthOptions,
): EncoreRouteHandlers<T, typeof options> => {
	return Object.entries(apiEndpoints).reduce(
		(api, [name, endpointFn]) => {
			if (endpointFn.options?.metadata?.SERVER_ONLY) return api;

			const requiresBody =
				"body" in endpointFn.options && endpointFn.options.body !== undefined;

			api[name as keyof T] = (
				requiresBody
					? (body: any) =>
							createEncoreAPIHandler(
								endpointFn,
								{
									wrapResponse: options.wrapResponse,
									currentRequest: options.currentRequest,
								},
								body,
							)
					: () =>
							createEncoreAPIHandler(endpointFn, {
								wrapResponse: options.wrapResponse,
								currentRequest: options.currentRequest,
							})
			) as EncoreEndpointFn<T[typeof name], typeof options>;

			return api;
		},
		{} as EncoreRouteHandlers<T, typeof options>,
	);
};




export const getValidatedSession = <T extends Record<string, Endpoint<any>>>(
	api: T,
) => {
	return async (cookie: string | undefined) => {
		if (!cookie) {
			throw APIError.unauthenticated("Cookie is not provided.");
		}

		try {
			const headers = new Headers();
			headers.append("Cookie", cookie);
			const sessionResponse = await api.getSession({ headers });

			if (!sessionResponse) {
				throw APIError.unauthenticated("The session is invalid.");
			}

			return {
				userID: sessionResponse.user.id,
				user: sessionResponse.user,
				session: sessionResponse.session,
			};
		} catch (error) {
			throw APIError.unauthenticated("The session is invalid.");
		}
	};
};
