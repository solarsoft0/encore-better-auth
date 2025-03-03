import { betterAuth } from "better-auth";
import { getEndpoints } from "better-auth/api";
import fs from "fs";
import path from "path";
import { generateEncoreRoutes } from "./generator";
import type { EncoreBetterAuth, EncoreBetterAuthOptions } from './types';
import { createEncoreApi } from './encore';
// Get the root of the project (instead of the build directory)
const projectRoot = process.cwd();



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
        } catch (error: any) {
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
        routeHandlers: encoreHandlers,
        ...auth
    };
}

