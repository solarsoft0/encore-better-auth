// // router.ts (or a new file if preferred)
// import { Service, api, type RequestMeta } from "encore.dev/api";
// import { getBody } from "./utils";
// import { APIError } from "./error";
// import { toResponse } from "./to-response";
// import { generator, getHTML } from "./openapi";
// import type { Middleware, Endpoint } from "./endpoint";
// import {
//     createRouterMiddlewares,
//     handleRequest as baseHandleRequest,
// } from "./custom-router";

// // Define RouterConfig compatible with BetterAuthOptions subset
// export interface RouterConfig {
//     throwError?: boolean;
//     onError?: (
//         e: unknown
//     ) => void | Promise<void> | Response | Promise<Response>;
//     basePath?: string;
//     routerMiddleware?: Array<{
//         path: string;
//         middleware: Middleware;
//     }>;
//     routerContext?: Record<string, any>;
//     onResponse?: (res: Response) => any | Promise<any>;
//     onRequest?: (req: Request) => any | Promise<any>;
//     openapi?: {
//         disabled?: boolean;
//         path?: string;
//         scalar?: {
//             title?: string;
//             description?: string;
//             logo?: string;
//             theme?: string;
//         };
//     };
// }

// // Custom response wrapper
// interface HandlerResponseWrapper {
//     response: Response | any;
//     headers: Headers;
//     contextData: Record<string, any>;
// }

// // Custom handleRequest with header propagation
// async function handleRequest<T>(
//     endpoint: Endpoint,
//     typedReq: T,
//     config: RouterConfig
// ): Promise<HandlerResponseWrapper> {
//     endpoint.headers = endpoint.headers || new Headers();

//     const context = {
//         path: endpoint.path,
//         method: endpoint.options.method as string,
//         headers: endpoint.headers,
//         params: {}, // Path params would come from Encore’s api() req if defined
//         request: null, // Not directly available in typed endpoints, fetched via currentRequest if needed
//         body: typedReq,
//         query: {}, // Query params are part of typedReq in Encore
//         _flag: "router" as const,
//         asResponse: true,
//         context: config.routerContext,
//         middlewareData: {},
//     };

//     try {
//         const response = await baseHandleRequest(endpoint, typedReq, config);
//         return {
//             response,
//             headers: endpoint.headers,
//             contextData: context.middlewareData || {},
//         };
//     } catch (error) {
//         if (error instanceof APIError) {
//             error.headers = endpoint.headers;
//             return {
//                 response: toResponse(error),
//                 headers: endpoint.headers,
//                 contextData: context.middlewareData || {},
//             };
//         }
//         console.error(`# SERVER_ERROR: `, error);
//         return {
//             response: new Response(null, {
//                 status: 500,
//                 statusText: "Internal Server Error",
//             }),
//             headers: endpoint.headers,
//             contextData: {},
//         };
//     }
// }

// // Refactored createRouter
// export const createRouter = <
//     E extends Record<string, Endpoint>,
//     Config extends RouterConfig
// >(
//     endpoints: E,
//     config?: Config
// ) => {
//     // Add OpenAPI endpoint if not disabled
//     if (!config?.openapi?.disabled) {
//         const openapi = {
//             path: "/api/reference",
//             ...config?.openapi,
//         };
//         endpoints["openapi"] = {
//             path: openapi.path,
//             method: "GET",
//             options: { method: "GET" },
//             headers: new Headers(),
//             async handler(c: any) {
//                 const schema = await generator(endpoints);
//                 return new Response(getHTML(schema, openapi.scalar), {
//                     headers: { "Content-Type": "text/html" },
//                 });
//             },
//         } as Endpoint;
//     }

//     // Define middleware using custom-router logic
//     const middlewares = createRouterMiddlewares(endpoints, {
//         basePath: config?.basePath,
//         routerMiddleware: config?.routerMiddleware,
//         afterMiddleware: [
//             {
//                 path: "/**",
//                 middleware: async (ctx: any) => {
//                     const wrapper = ctx.response as HandlerResponseWrapper;
//                     if (
//                         !wrapper ||
//                         typeof wrapper !== "object" ||
//                         !("response" in wrapper)
//                     ) {
//                         return ctx.response;
//                     }

//                     const { response, headers, contextData } = wrapper;
//                     if (response instanceof Response) {
//                         headers.forEach((value, key) => {
//                             if (key === "set-cookie") {
//                                 response.headers.append(key, value);
//                             } else if (!response.headers.has(key)) {
//                                 response.headers.set(key, value);
//                             }
//                         });
//                     }

//                     const currentReq = currentRequest();
//                     const meta = currentReq as
//                         | (RequestMeta & { type: "api-call" })
//                         | undefined;
//                     if (
//                         meta &&
//                         contextData &&
//                         Object.keys(contextData).length > 0
//                     ) {
//                         req.middlewareData = {
//                             ...meta.middlewareData,
//                             betterAuth: contextData,
//                         };
//                     }

//                     return response instanceof Response
//                         ? response
//                         : wrapper.response;
//                 },
//             },
//         ],
//         routerContext: config?.routerContext,
//         onRequest: config?.onRequest,
//         onResponse: config?.onResponse,
//         onError: config?.onError,
//     });

//     // Generate static handlers
//     const handlers: Record<string, any> = {};
//     for (const [key, endpoint] of Object.entries(endpoints)) {
//         if (!endpoint.options || endpoint.options.metadata?.SERVER_ONLY)
//             continue;

//         const methods = Array.isArray(endpoint.options.method)
//             ? endpoint.options.method
//             : [endpoint.options.method];
//         for (const method of methods) {
//             const handlerKey = `${key}_${method.toLowerCase()}`;
//             handlers[handlerKey] = api(
//                 {
//                     method,
//                     path: `${config?.basePath || ""}${endpoint.path}`,
//                     expose: true,
//                 },
//                 async (req: any) => {
//                     const wrapper = await handleRequest(
//                         endpoint,
//                         req,
//                         config || {}
//                     );
//                     return wrapper.response;
//                 }
//             );
//         }
//     }

//     // Define service at invocation (assumes top-level usage in calling context)
//     return {
//         createService: (serviceName: string) =>
//             new Service(serviceName, { middlewares }),
//         endpoints,
//         handlers,
//     };
// };

// export type Router = ReturnType<typeof createRouter>;
