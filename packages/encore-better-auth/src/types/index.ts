import type { betterAuth, BetterAuthOptions, Endpoint } from "better-auth";
import type { getEndpoints } from "better-auth/api";
import type { RequestMeta } from "encore.dev";
import type { Middleware } from "encore.dev/api";

// export type EncoreEndpointFn<T extends Endpoint<any>> = T extends Endpoint<
//     any,
//     any,
//     infer Handler
// >
//     ? Handler extends (args: infer ArgType) => Promise<infer ResponseType>
//         ? ArgType extends { body?: infer B }
//             ? [B] extends [never] | [undefined]
//                 ? () => Promise<ResponseType>
//                 : (body: B) => Promise<ResponseType>
//             : () => Promise<ResponseType>
//         : never
//     : never;

export type EncoreEndpointFn<
	T,
	O extends EncoreBetterAuthOptions,
> = T extends Endpoint<any, any, infer Handler>
	? Handler extends (args: infer ArgType) => Promise<infer ReturnType>
		? ArgType extends { body?: infer B }
			? [B] extends [never] | [undefined]
				? O["wrapResponse"] extends true
					? () => Promise<{ data: ReturnType }>
					: () => Promise<ReturnType>
				: O["wrapResponse"] extends true
					? (body: B) => Promise<{ data: ReturnType }>
					: (body: B) => Promise<ReturnType>
			: O["wrapResponse"] extends true
				? () => Promise<{ data: ReturnType }>
				: () => Promise<ReturnType>
		: never
	: never;

export type EncoreBetterAuthOptions = BetterAuthOptions & {
		// Set to true to comply with Encore's technical limitation. Without this, route generation won't work. It also enables us to not worry too much about OpenAPI spec updates on BetterAuth's end.
		wrapResponse: boolean;
		generateRoutes?: boolean;
		outputPath?: string; // Allows specifying where to save the routes file
		currentRequest: () => RequestMeta | undefined; // function to geet currentRequest (this not available in encore.dev)
	};

export type BetterAuthReturn<O extends BetterAuthOptions> = ReturnType<
	typeof betterAuth<O>
>;

export type ContextType<O extends BetterAuthOptions> = Awaited<
	BetterAuthReturn<O>["$context"]
>;

export type ApiEndpoints<O extends BetterAuthOptions> = ReturnType<
	typeof getEndpoints<ContextType<O>, O>
>["api"];

export type EncoreBetterAuth<O extends EncoreBetterAuthOptions> =
	BetterAuthReturn<O> & {
		routeHandlers: EncoreRouteHandlers<ApiEndpoints<O>, O>;
		middlewares: Middleware[];
	};

export type EncoreRouteHandlers<
	T extends Record<string, Endpoint<any>>,
	O extends EncoreBetterAuthOptions,
> = {
	[K in keyof T]: EncoreEndpointFn<T[K], O>;
};
