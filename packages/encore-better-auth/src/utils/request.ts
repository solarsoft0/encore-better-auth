import type { AuthContext, BetterAuthOptions, GenericEndpointContext, HTTPMethod, MiddlewareContext, MiddlewareOptions } from "better-auth";
import type { APICallMeta } from "encore.dev";
import { APIError, type Method } from 'encore.dev/api';
import { getBaseURL } from './url';

export function getRequestFromAPICall(meta: APICallMeta): Request {
    const url = new URL(meta.pathAndQuery, "http://localhost"); // Base URL can be replaced as needed

    // Create headers object
    const headers = new Headers();
    Object.entries(meta.headers).forEach(([key, value]) => {
        if (Array.isArray(value)) {
            // For headers with multiple values
            value.forEach((val) => headers.append(key, val));
        } else {
            headers.set(key, value);
        }
    });

    const needsBody =
        ["POST", "PUT", "PATCH"].includes(meta.method) && meta.parsedPayload;

    // Create body if needed
    let body = undefined;
    if (needsBody && meta.parsedPayload) {
        body = JSON.stringify(meta.parsedPayload);
    }

    // Create the request object
    const request = new Request(url.toString(), {
        method: meta.method,
        headers,
        body,
    });

    return request;
}



export async function prepareRequestContext(
    meta: APICallMeta,
    betterAuthContext: AuthContext,
    trustedOrigins?: string[] | ((request: Request) => string[])
) {
    const request = getRequestFromAPICall(meta);
    const url = new URL(request.url);
    const path = url.pathname;

    const body = meta.parsedPayload;

    betterAuthContext.trustedOrigins;
    betterAuthContext.trustedOrigins = [
        ...(Array.isArray(trustedOrigins)
            ? trustedOrigins
            : typeof trustedOrigins === "function"
            ? trustedOrigins(request)
            : []),
        betterAuthContext.baseURL,
        url.origin,
    ];

    const context: MiddlewareContext<
        MiddlewareOptions,
        AuthContext & {
            returned?: unknown;
            responseHeaders?: Headers;
        }
    > = {
        path,
        method: request.method as HTTPMethod,
        headers: request.headers,
        // @ts-ignore
        params: meta.pathParams ? { ...meta.pathParams } : {},
        request,
        body,
        query: Object.fromEntries(url.searchParams.entries()),
        _flag: "router" as const,
        // @ts-ignore
        context: betterAuthContext || {},
    };

    return { context };
}
