import { betterAuth, BetterAuthOptions, Endpoint } from "better-auth";
import { getEndpoints } from "better-auth/api";
import fs from "fs";
import path from "path";
import { generateEncoreRoutes } from "./generator";
// Get the root of the project (instead of the build directory)
const projectRoot = process.cwd();

type EncoreRouteHandlers<T extends Record<string, Endpoint<any>>> = {
    [K in keyof T]: EncoreEndpointFn<T[K]>;
};
type EncoreEndpointFn<T extends Endpoint<any>> = T extends Endpoint<
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

type EncoreBetterAuthOptions = BetterAuthOptions & {
    generateRoutes?: boolean;
    outputPath?: string; // Allows specifying where to save the routes file
};

type BetterAuthReturn<O extends BetterAuthOptions> = ReturnType<
    typeof betterAuth<O>
>;

type ContextType<O extends BetterAuthOptions> = Awaited<
    BetterAuthReturn<O>["$context"]
>;

type ApiEndpoints<O extends BetterAuthOptions> = ReturnType<
    typeof getEndpoints<ContextType<O>, O>
>["api"];

type EncoreBetterAuth<O extends EncoreBetterAuthOptions> =
    BetterAuthReturn<O> & {
        routeHandlers: EncoreRouteHandlers<ApiEndpoints<O>>;
    };


export function encoreBetterAuth<O extends EncoreBetterAuthOptions>(
    options: O
): EncoreBetterAuth<O> {
    const auth = betterAuth(options);
    const { $context } = auth;
    // Awaited<typeof auth.$context>
    const { api: apiEndpoints } = getEndpoints($context, options);

    const encoreHandlers = createEncoreApi(apiEndpoints);
    if (options?.generateRoutes) {
        const outputPath =
            options.outputPath ??
            path.join(projectRoot, "/auth/better-auth.routes.ts");

        // Check if file exists and its size
        let shouldGenerate = true;
        try {
            const stats = fs.statSync(outputPath);
            if (stats.isFile() && stats.size > 0) {
                shouldGenerate = false; // File exists and is not empty
            }
        } catch (error) {
            // If file doesn't exist (ENOENT), proceed with generation
            // @ts-ignore
            if (error.code !== "ENOENT") {
                throw error; // Rethrow other errors (permissions, etc.)
            }
        }

        if (shouldGenerate) {
            generateEncoreRoutes($context, options).then((value) => {
                fs.writeFileSync(outputPath, value);
                console.log(`Routes file generated at: ${outputPath}`);
            });
        } else {
            console.log(
                `Routes file already exists and is not empty at: ${outputPath}`
            );
        }
    }

    return {
        ...auth,
        routeHandlers: encoreHandlers,
    };
}

const createEncoreApi = <T extends Record<string, Endpoint<any>>>(
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
