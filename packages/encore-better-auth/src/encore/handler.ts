import {
	logger,
	type AuthContext,
	type BetterAuthOptions,
	type Endpoint,
	type EndpointContext,
	type Middleware,
} from "better-auth";

import {
	APIError as BetterAuthAPIError,
	originCheckMiddleware,
} from "better-auth/api";
import type { APICallMeta, RequestMeta } from "encore.dev";
import type { HandlerResponse, MiddlewareRequest, Next } from "encore.dev/api";
import { middleware } from "encore.dev/api";
import { onRequestRateLimit } from "../api/rate-limiter";
import type { EncoreBetterAuthOptions } from "../types";
import { prepareRequestContext } from "../utils/request";
import { convertAPIError } from "./error";


export const createEncoreAPIHandler = async (
	api: Endpoint,
	{
		wrapResponse,
		currentRequest,
	}: {
		wrapResponse: boolean;
		currentRequest: () => RequestMeta | undefined;
	},
	_payload?: any,
) => {
	// todo options seems not needed here, sincee we have authContext.
	const currentReq = currentRequest && (currentRequest() as APICallMeta);

	if (!currentReq) throw Error("current Request Error");

	// middleware already rejected none APICallMeta.
	const inputContext = currentReq.middlewareData
		?.betterAuthRequestContext as EndpointContext<
		typeof api.path,
		typeof api.options
	>;

	const ctx = inputContext.context as AuthContext & {
		options: EncoreBetterAuthOptions;
	};

	const req = inputContext.request as Request;

	try {
		// Process onRequest plugins
		// todo confirm if options, are used in plugins, if not no need of passing them through routes.
		for (const plugin of ctx.options.plugins || []) {
			if (plugin.onRequest) {
				const response = await plugin.onRequest(req, ctx);
				if (response instanceof Response) {
					return wrapResponse ? { data: response } : response;
				}
				if (response && "response" in response) {
					return wrapResponse ? { data: response.response } : response.response;
				}
			}
		}

		const rateLimitResponse = await onRequestRateLimit(req, ctx);
		if (rateLimitResponse) {
			return wrapResponse ? { data: rateLimitResponse } : rateLimitResponse;
		}

		// @ts-ignore
		inputContext.returnHeaders = true;

		const result = await api(inputContext);

		// Process onResponse plugins
		for (const plugin of ctx.options.plugins || []) {
			if (plugin.onResponse) {
				const pluginResponse = await plugin.onResponse(result, ctx);
				if (pluginResponse instanceof Response) {
					return wrapResponse ? { data: pluginResponse } : pluginResponse;
				}
				if (pluginResponse && "response" in pluginResponse) {
					return wrapResponse
						? { data: pluginResponse.response }
						: pluginResponse.response;
				}
			}
		}

		// const response = result as { headers: Headers; response: any };

		// work around to allow resolving... todo notify @andre InvalidArg, JS functions cannot be represented as a serde_json::Value.
		return wrapResponse ? { data: result } : result;
	} catch (e) {
		throw handleError(e, ctx, ctx.options);
	}
};

function handleError(e: unknown, ctx: AuthContext, options: BetterAuthOptions) {
	if (e instanceof BetterAuthAPIError && e.status === "FOUND") {
		return;
	}

	if (options.onAPIError?.throw) {
		throw e;
	}

	if (options.onAPIError?.onError) {
		return options.onAPIError.onError(e, ctx);
	}

	const optLogLevel = options.logger?.level;
	const log =
		optLogLevel === "error" || optLogLevel === "warn" || optLogLevel === "debug"
			? logger
			: undefined;

	if (options.logger?.disabled !== true) {
		if (
			e &&
			typeof e === "object" &&
			"message" in e &&
			typeof e.message === "string"
		) {
			if (
				e.message.includes("no column") ||
				e.message.includes("column") ||
				e.message.includes("relation") ||
				e.message.includes("table") ||
				e.message.includes("does not exist")
			) {
				ctx.logger?.error(e.message);
				return;
			}
		}

		if (e instanceof BetterAuthAPIError) {
			if (e.status === "INTERNAL_SERVER_ERROR") {
				ctx.logger.error(e.status, e);
			}
			log?.error(e.message);
		} else {
			ctx.logger?.error(
				e && typeof e === "object" && "name" in e ? (e.name as string) : "",
				e,
			);
		}
	}

	// Return an appropriate error response
	return createErrorResponse(e);
}

function createErrorResponse(error: any) {
	if (error instanceof BetterAuthAPIError) {
		return {
			status: error.status || "INTERNAL_SERVER_ERROR",
			message: error.message,
			// data: error.data,
		};
	}

	return {
		status: "INTERNAL_SERVER_ERROR",
		message: "An unexpected error occurred",
		error: error.message,
	};
}

// Middleware creation function
export function createEncoreMiddlewares(
	middlewares: Array<{
		path: string;
		middleware: Middleware;
	}>,
	aContext: Promise<AuthContext>,
	options: EncoreBetterAuthOptions,
) {
	return [
		// first middleware prepare context.
		middleware(async (req, next) => {
			const authContext = await aContext;
			const meta =
				req.requestMeta?.type === "api-call"
					? (req.requestMeta as APICallMeta)
					: undefined;
			if (!meta || meta.type !== "api-call") throw Error;

			const { context } = await prepareRequestContext(
				meta,
				authContext,
				options.trustedOrigins,
			);

			await originCheckMiddleware(context);

			req.data.betterAuthRequestContext = context;

			return next(req);
		}),
		//  middleware
		...middlewares.map(
			({
				path,
				middleware: mw,
			}: {
				path: string;
				middleware: Middleware;
			}) =>
				middleware(
					{ target: { expose: true, tags: [path] } },
					async (req: MiddlewareRequest, next: Next) => {
						const meta = req.requestMeta as APICallMeta;

						const context = meta.middlewareData?.betterAuthRequestContext;
						await mw(context);
						// middleware may update context.
						req.data.betterAuthRequestContext = context;
						return next(req);
					},
				),
		),

		middleware({ target: { expose: true } }, async (req, next) => {
			const wrapResponse = options.wrapResponse;

			let wrappedResponse: HandlerResponse;

			try {
				wrappedResponse = await next(req);
			} catch (error) {
				throw convertAPIError(error);
			}

			const incomingPayload = wrappedResponse.payload;

			const { content, headers } = extractPayload(
				incomingPayload,
				wrapResponse,
			);

			mergeHeaders(wrappedResponse, headers);

			// for when content return APIError
			if (content?.status === "FOUND" && content?.statusCode) {
				wrappedResponse.status = content.statusCode;
				wrappedResponse.payload = {};
				return wrappedResponse;
			}

			wrappedResponse.payload = formatPayload(content, wrapResponse);

			return wrappedResponse;
		}),
	];
}

function extractPayload(
	payload: any,
	wrapResponse: boolean,
): { content: any; headers: Headers | null } {
	// If payload is not an object (e.g., null, undefined, primitive), return null content
	if (!payload || typeof payload !== "object") {
		return { content: null, headers: null };
	}

	if (wrapResponse) {
		// Expect { data: ... } where data can be an object or APIError instance
		if (!("data" in payload)) {
			return { content: null, headers: null };
		}

		const data = payload.data;

		// Ensure data is an object (includes APIError instances)
		if (typeof data !== "object" || data === null) {
			return { content: null, headers: null };
		}

		// Case 1: data is an object with a response key
		if ("response" in data) {
			return {
				content: data.response,
				headers: data.headers || null,
			};
		}

		return {
			content: data, // data or APIError
			headers: data.headers || null, // Headers from APIError
		};
	} else {
		// Expect { response: ..., headers: ... }
		if (!("response" in payload)) {
			return { content: null, headers: null };
		}
		return {
			content: payload.response,
			headers: payload.headers || null,
		};
	}
}

function mergeHeaders(
	wrappedResponse: HandlerResponse,
	headers: Headers | null,
): void {
	if (!headers) return;

	const responseHeader = wrappedResponse.header;

	headers.forEach((value: string, key: string) => {
		const normalizedKey = key.toLowerCase(); // Normalize for case-insensitivity
		if (normalizedKey === "set-cookie") {
			responseHeader.add("Set-Cookie", value);
		} else if (!(key in responseHeader.headers)) {
			responseHeader.set(key, value);
		}
	});
}
function formatPayload(content: any, wrapResponse: boolean): any {
	return wrapResponse ? { data: content } : content;
}


