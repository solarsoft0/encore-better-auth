import type { Endpoint } from 'better-auth';
import type { EncoreEndpointFn, EncoreRouteHandlers } from '../types';

export const createEncoreApi = <T extends Record<string, Endpoint<any>>>(
    apiEndpoints: T
): EncoreRouteHandlers<T> => {
    return Object.entries(apiEndpoints).reduce((api, [name, endpointFn]) => {
        const requiresBody =
            "body" in endpointFn.options &&
            endpointFn.options.body !== undefined;

        api[name as keyof T] = (
            requiresBody
                ? (body: any) => endpointFn({ body })
                : () => endpointFn({})
        ) as EncoreEndpointFn<T[typeof name]>;

        return api;
    }, {} as EncoreRouteHandlers<T>);
};
