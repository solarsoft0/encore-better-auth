import type { Endpoint } from "better-auth";
import type { EncoreBetterAuthOptions, EncoreEndpointFn, EncoreRouteHandlers } from "../types";
import { createEncoreAPIHandler } from "./handler";

export const createEncoreHandlers = <T extends Record<string, Endpoint<any>>>(
    apiEndpoints: T,
    options: EncoreBetterAuthOptions,
): EncoreRouteHandlers<T> => {
    return Object.entries(apiEndpoints).reduce((api, [name, endpointFn]) => {
        if (endpointFn.options?.metadata?.SERVER_ONLY) return api;

        const requiresBody =
            "body" in endpointFn.options &&
            endpointFn.options.body !== undefined;

        api[name as keyof T] = (
            requiresBody
                ? (body: any) =>
                      createEncoreAPIHandler(
                          endpointFn,
                          {
                              currentRequest: options.currentRequest,
                          },
                          body
                      )
                : () =>
                      createEncoreAPIHandler(endpointFn, {
                          currentRequest: options.currentRequest,
                      })
        ) as EncoreEndpointFn<T[typeof name]>;

        return api;
    }, {} as EncoreRouteHandlers<T>);
};
