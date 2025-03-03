// // encore-auth-router.ts
// import { middleware, currentRequest, MiddlewareRequest, Next } from "encore.dev/api";
// import { toResponse } from "./to-response";
// import { APIError, Endpoint, RouterConfig } from 'better-auth';
// import { RequestMeta } from 'encore.dev';


// export const createRequestHandler = <E extends Record<string, Endpoint>, Config extends RouterConfig>(endpoints: E, config?: Config) => {


//   return {
//   };

// }
// // todo we need this to be the wrapper of every endpoint.annd maintain type integrity.

// // Core handler function for endpoint execution
// export async function handleRequest<T>(
//     endpoint: Endpoint,
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

//     const path =
//         meta?.path || (currentReq ? new URL(currentReq.url).pathname : "");

//     const context = {
//         path,
//         method: endpoint.options?.method || meta?.method || "UNKNOWN",
//         headers: endpoint.headers || new Headers(),
//         params: pathParams,
//         request: currentReq,
//         body: typedReq ?? meta?.parsedPayload,
//         query: currentReq
//             ? Object.fromEntries(new URL(currentReq.url).searchParams)
//             : {},
//         _flag: "router" as const,
//         asResponse: true,
//         context: config.extraContext,
//     };

//     try {
//         if (config.onRequest && currentReq) {
//             const onReq = await config.onRequest(currentReq);
//             if (onReq instanceof Response) return onReq;
//         }

//         const response = await endpoint(context);
//         const onRes = await config.onResponse?.(response as Response);
//         return onRes instanceof Response ? onRes : response;
//     } catch (error) {
//         // todo toResponse needs to reflect right error code but not structure.
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
//         ...beforeMiddlewares.map(({ path, middleware: mw }) =>
//             middleware(
//                 { target: { expose: true } },
//                 async (req: MiddlewareRequest, next: Next) => {
//                     const meta =
//                         currentRequest()?.type === "api-call"
//                             ? (currentRequest() as RequestMeta & {
//                                   type: "api-call";
//                               })
//                             : undefined;
//                     if (!meta || meta.type !== "api-call") return next(req);

//                     const reqPath = config.basePath
//                         ? meta.path.split(config.basePath)[1]
//                         : meta.path;
//                     if (!reqPath?.startsWith(path)) return next(req);

//                     const context = {
//                         path: reqPath,
//                         method: meta.method,
//                         headers: meta.headers,
//                         params: meta.pathParams,
//                         request: req,
//                         body: meta.parsedPayload,
//                         query: Object.fromEntries(
//                             new URL(meta.pathAndQuery).searchParams
//                         ),
//                         _flag: "router" as const,
//                         asResponse: true,
//                         context: config.routerContext,
//                         middlewareData: meta.middlewareData,
//                     };

//                     const result = await mw(context);
//                     if (result instanceof Response) return result;
//                     if (
//                         result &&
//                         typeof result === "object" &&
//                         !Array.isArray(result)
//                     ) {
//                         // @ts-ignore
//                         req.middlewareData = {
//                             ...meta.middlewareData,
//                             ...result,
//                         };
//                     }
//                     return next(req);
//                 }
//             )
//         ),
//         // After-handler middleware with default unwrapping
//         ...afterMiddlewares.map(({ path, middleware }) =>
//             middleware({ target: { expose: true } }, async (req: MiddlewareRequest, next: Next) => {
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

//                 const wrappedResponse = await next(req);

//                 const context = {
//                     path: reqPath,
//                     method: meta.method,
//                     headers: meta.headers,
//                     params: meta.pathParams,
//                     request: req,
//                     body: meta.parsedPayload,
//                     query: Object.fromEntries(new URL(meta.pathAndQuery).searchParams),
//                     _flag: "router" as const,
//                     asResponse: true,
//                     context: config.routerContext,
//                     middlewareData: meta.middlewareData,
//                     response: wrappedResponse,
//                 };

//                 const afterResult = await middleware(context);
//                 return afterResult instanceof Response
//                     ? afterResult
//                     : wrappedResponse;
//             })
//         ),
//         // Default after middleware to unwrap HandlerResponseWrapper
//         middleware({ target: { expose: true } }, async (req, next) => {
//             const meta =
//                 currentRequest()?.type === "api-call"
//                     ? (currentRequest() as RequestMeta & { type: "api-call" })
//                     : undefined;
//             if (!meta || meta.type !== "api-call") return next(req);

//             const wrappedResponse = await next(req);
//             const wrapper = wrappedResponse.payload;

//             if (
//                 !wrapper ||
//                 typeof wrapper !== "object" ||
//                 !("response" in wrapper)
//             ) {
//                 return wrappedResponse; // Fallback if not a wrapper
//             }

//             const { response, headers, contextData } = wrapper;

//             // Merge headers into response
//             if (response instanceof Response) {
//                 headers.forEach((value, key) => {
//                     if (key === "set-cookie") {
//                         response.headers.append(key, value);
//                     } else if (!response.headers.has(key)) {
//                         response.headers.set(key, value);
//                     }
//                 });
//             }

//             // Propagate context data
//             if (contextData && Object.keys(contextData).length > 0) {
//                 req.middlewareData = {
//                     ...meta.middlewareData,
//                     betterAuth: contextData,
//                 };
//             }

//             return response instanceof Response ? response : wrapper.response;
//         }),
//     ];

// }

// // Router factory function
// export function createRouter<E extends Record<string, any>>(
//     endpoints: E,
//     config: RouterConfig = {}
// ) {
//     return {
//         endpoints,
//         middlewares: createRouterMiddlewares(endpoints, config),
//         createHandler: <T>(key: string, method: string) => ({
//             endpoint: endpoints[key],
//             method,
//             config,
//         }),
//     };
// }

// export type Router = ReturnType<typeof createRouter>;
