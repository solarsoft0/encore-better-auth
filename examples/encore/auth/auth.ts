// import { APIError, getEndpoints} from 'better-auth/api';
import { betterAuth } from 'better-auth';




export const auth = betterAuth({
    // Your config here
});


auth.api.verifyEmail({
    query: {
        token: ""
    },
});

// export const encoreBetterAuth = (encoreBetterAuth)({
//     // Your config here
// });

// auth.handler

// // Example usage:
// await auth.api.getSession({ headers: headers() });





// export interface RouterConfig {
//     throwError?: boolean;
//     onError?: (
//         e: unknown
//     ) => void | Promise<void> | Response | Promise<Response>;
//     basePath?: string;
//     routerMiddleware?: Array<{ path: string; middleware: any }>;
//     afterMiddleware?: Array<{ path: string; middleware: any }>;
//     routerContext?: Record<string, any>;
//     onResponse?: (res: Response) => any | Promise<any>;
//     onRequest?: (req: Request) => any | Promise<any>;
// }



// export async function handleRequest<T>(
//     endpoint: any,
//     typedReq: T,
//     config: RouterConfig
// ) {
//     const currentReq = currentRequest();
//     const meta =
//         currentReq?.type === "api-call"
//             ? (currentReq as RequestMeta & { type: "api-call" })
//             : undefined;
//     const pathParams = meta?.pathParams || {};
//     const middlewareData = meta?.middlewareData || {};
//     const request = meta?.request;

//     const path = meta?.path || (request ? new URL(request.url).pathname : "");

//     const context = {
//         path,
//         method: meta?.method || "UNKNOWN",
//         headers: meta?.headers || {},
//         params: pathParams,
//         request,
//         body: typedReq,
//         query: request
//             ? Object.fromEntries(new URL(request.url).searchParams)
//             : {},
//         _flag: "router" as const,
//         asResponse: true,
//         context: config.routerContext,
//         middlewareData,
//     };

//     try {
//         if (config.onRequest && request) {
//             const onReq = await config.onRequest(request);
//             if (onReq instanceof Response) return onReq;
//         }

//         const response = await endpoint(context);
//         const onRes = await config.onResponse?.(response as Response);
//         return onRes instanceof Response ? onRes : response;
//     } catch (error) {
//         if (error instanceof APIError) return toResponse(error);
//         await config.onError?.(error);
//         return new Response(null, {
//             status: 500,
//             statusText: "Internal Server Error",
//         });
//     }
// }



// // Middleware creation function
// export function createRouterMiddlewares<E extends Record<string, any>>(
//     endpoints: E,
//     config: RouterConfig
// ) {
//     const beforeMiddlewares = config.routerMiddleware || [];
//     const afterMiddlewares = config.afterMiddleware || [];

//     return [
//         // Before-handler middleware
//         ...beforeMiddlewares.map(({ path, middleware: middlewareFnc }) =>
//             // @ts-ignore
//             middleware({ target: { expose: true } }, async (req, next) => {
//                 const meta: any =
//                     currentRequest()?.type === "api-call"
//                         ? (currentRequest() as RequestMeta & {
//                               type: "api-call";
//                           })
//                         : undefined;
//                 if (!meta || meta.type !== "api-call") return next(req);

//                 const reqPath = config.basePath
//                     ? meta.path.split(config.basePath)[1]
//                     : meta.path;
//                 if (!reqPath?.startsWith(path)) return next(req);

//                 const context = {
//                     path: reqPath,
//                     method: meta.method,
//                     headers: meta.headers,
//                     params: meta.pathParams,
//                     request: req,
//                     body: await getBody(req),
//                     query: Object.fromEntries(new URL(meta.url).searchParams),
//                     _flag: "router" as const,
//                     asResponse: true,
//                     context: config.routerContext,
//                     middlewareData: meta.middlewareData,
//                 };

//                 const result = await middlewareFnc(context);
//                 if (result instanceof Response) return result;
//                 if (
//                     result &&
//                     typeof result === "object" &&
//                     !Array.isArray(result)
//                 ) {
//                     // @ts-ignore
//                     req.data.betterAuth = { ...meta.middlewareData, ...result };
//                 }
//                 return next(req);
//             })
//         ),
//         // After-handler middleware
//         ...afterMiddlewares.map(({ path, middleware }) =>
//             // @ts-ignore
//             middleware({ target: { expose: true } }, async (req, next) => {
//                 const meta =
//                     currentRequest()?.type === "api-call"
//                         ? (currentRequest() as RequestMeta & {
//                               type: "api-call";
//                           })
//                         : undefined;
//                 if (!meta || meta.type !== "api-call") return next(req);

//                 const reqPath = config.basePath
//                     ? meta.path.split(config.basePath)[1]
//                     : meta.path;
//                 if (!reqPath?.startsWith(path)) return next(req);

//                 const response = await next(req);

//                 const context = {
//                     path: reqPath,
//                     method: meta.method,
//                     headers: meta.headers,
//                     params: meta.pathParams,
//                     request: req,
//                     body: await getBody(req),
//                     query: Object.fromEntries(new URL(req.url).searchParams),
//                     _flag: "router" as const,
//                     asResponse: true,
//                     context: config.routerContext,
//                     middlewareData: meta.middlewareData,
//                     response,
//                 };

//                 const afterResult = await middleware(context);
//                 return afterResult instanceof Response ? afterResult : response;
//             })
//         ),
//     ];
// }
