
import type { betterAuth, BetterAuthOptions, Endpoint } from "better-auth";
import type { getEndpoints } from 'better-auth/api';
import type { RequestMeta } from 'encore.dev';
import type { Middleware } from 'encore.dev/api';

export type EncoreRouteHandlers<T extends Record<string, Endpoint<any>>> = {
    [K in keyof T]: EncoreEndpointFn<T[K]>;
};
export type EncoreEndpointFn<T extends Endpoint<any>> = T extends Endpoint<
    any,
    any,
    infer Handler
>
    ? Handler extends (args: infer ArgType) => Promise<infer ResponseType>
        ? ArgType extends { body?: infer B }
            ? [B] extends [never] | [undefined]
                ? () => Promise<ResponseType>
                : (body: B) => Promise<ResponseType>
            : () => Promise<ResponseType>
        : never
    : never;

export type EncoreBetterAuthOptions = BetterAuthOptions & {
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
        routeHandlers: EncoreRouteHandlers<ApiEndpoints<O>>;
        middlewares: Middleware[];
    };