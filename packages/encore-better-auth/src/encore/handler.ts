import type {
    AuthContext,
    BetterAuthOptions,
    Endpoint,
    EndpointContext,
    Middleware,
} from "better-auth";

import { logger } from "better-auth";
import { APIError, originCheckMiddleware } from "better-auth/api";
import type { APICallMeta, RequestMeta } from "encore.dev";
import type { MiddlewareRequest, Next } from "encore.dev/api";
import { middleware } from "encore.dev/api";
import log from "encore.dev/log";
import { onRequestRateLimit } from "../api/rate-limiter";
import type { EncoreBetterAuthOptions } from "../types";
import { prepareRequestContext } from "../utils/request";

export const createEncoreAPIHandler = async (
    api: Endpoint,
    {
        currentRequest,
    }: {
        currentRequest: () => RequestMeta | undefined;
    },
    _payload?: any
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
                    return response;
                }
                if (response && "response" in response) {
                    return response.response;
                }
            }
        }

        const rateLimitResponse = await onRequestRateLimit(req, ctx);
        if (rateLimitResponse) {
            return rateLimitResponse;
        }


        // @ts-ignore
        inputContext.returnHeaders = true;

        const result = await api(inputContext);

        // Process onResponse plugins
        for (const plugin of ctx.options.plugins || []) {
            if (plugin.onResponse) {
                const pluginResponse = await plugin.onResponse(result, ctx);
                if (pluginResponse instanceof Response) {
                    return pluginResponse;
                }
                if (pluginResponse && "response" in pluginResponse) {
                    return pluginResponse.response;
                }
            }
        }

    
        // const response = result as { headers: Headers; response: any };

        // work around to allow resolving... todo notify @andre InvalidArg, JS functions cannot be represented as a serde_json::Value.
        return result;
    } catch (e) {
        throw handleError(e, ctx, ctx.options);
    }
};

function handleError(e: unknown, ctx: AuthContext, options: BetterAuthOptions) {
    if (e instanceof APIError && e.status === "FOUND") {
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
        optLogLevel === "error" ||
        optLogLevel === "warn" ||
        optLogLevel === "debug"
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

        if (e instanceof APIError) {
            if (e.status === "INTERNAL_SERVER_ERROR") {
                ctx.logger.error(e.status, e);
            }
            log?.error(e.message);
        } else {
            ctx.logger?.error(
                e && typeof e === "object" && "name" in e
                    ? (e.name as string)
                    : "",
                e
            );
        }
    }

    // Return an appropriate error response
    return createErrorResponse(e);
}

function createErrorResponse(error: any) {
    if (error instanceof APIError) {
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
    options: BetterAuthOptions
) {
    return [
        middleware(async (req, next) => {
            // console.log(response, "from middleeware");
            // delete response.payload.headers;
            // response.payload = {
            //     hello: "hello",
            //     world: "world",
            // };
            // console.log(, "last middlewaree");

            return next(req);
        }),
        // first middleware prepare context.
        middleware(async (req, next) => {
            const authContext = await aContext;
            const meta =
                req.requestMeta?.type === "api-call"
                    ? (req.requestMeta as APICallMeta)
                    : undefined;
            if (!meta || meta.type !== "api-call") throw Error;

            log.debug("preparing context", meta);

            const { context } = await prepareRequestContext(
                meta,
                authContext,
                options.trustedOrigins
            );

            await originCheckMiddleware(context);

            req.data.betterAuthRequestContext = context;

            log.debug(meta.path, "from middle ware");

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
                        console.log(
                            path,
                            "this two should match pattern to run",
                            meta.path,
                            "from middle ware"
                        );

                        const context =
                            meta.middlewareData?.betterAuthRequestContext;
                        await mw(context);
                        // middleware may update context.
                        req.data.betterAuthRequestContext = context;
                        log.debug(context, "from middleware");
                        return next(req);
                    }
                )
        ),

        // Default after middleware to unwrap HandlerResponseWrapper
        middleware({ target: { expose: true } }, async (req, next) => {
            const meta = req.requestMeta as APICallMeta;

            const wrappedResponse = await next(req);
            const wrapper = wrappedResponse.payload;
            if (
                !wrapper ||
                typeof wrapper !== "object" ||
                !("response" in wrapper)
            ) {
                return wrappedResponse; // Fallback if not a wrapper
            }

            const { response, headers } = wrapper as {
                headers: Headers
                response: any;
            };

            // Merge headers into response
            if (response.headers) {
                log.debug("old header", meta.headers);
                log.debug("new header", headers);
                response.headers.forEach((value: string, key: string) => {
                    if (key === "set-cookie") {
                        console.log(value, key, "cookies needs attention");
                        // wrappedResponse.header.headers.append(key, value);
                    } else if (!response.header.has(key)) {
                        wrappedResponse.header.set(key, value);
                    }
                });
            }

             wrappedResponse.payload = response;
            return wrappedResponse;
        }),
    ];
}
