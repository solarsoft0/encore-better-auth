import { api, middleware } from "encore.dev/api";
import { Service } from "encore.dev/service";
import { encoreBetterAuth } from "./encore-better-auth";
import { apiKey } from "better-auth/plugins";

// Encore will consider this directory and all its subdirectories as part of the "users" service.
// https://encore.dev/docs/ts/primitives/services
export default new Service("auth", {
    middlewares: [
        middleware(async (req, next) => {
            const response = await next(req);
            console.log(response, "from middleeware");
            delete response.payload.headers;
            response.payload = {
                hello: "hello",
                world: "world",
            };
            console.log(req.requestMeta);
            return response;
        }),
    ],
});

export const { routeHandlers } = encoreBetterAuth({
    plugins: [
        apiKey({
            rateLimit: {
                enabled: true,
                timeWindow: 1000 * 60 * 60 * 24, // 1 day
                maxRequests: 10, // 10 requests per day
            },
        }),
    ],
    generateRoutes: false,
    // outputPath: "",
    // printRoutes: true,
});





// // routeHandlers.getApiKey()
// console.log(typeof routeHandlers.listUserAccounts, "type of list");
// console.log(typeof routeHandlers.signUpEmail, "type of list");





// const value = await routeHandlers.ok();
// const account = await routeHandlers.signInEmail({
//     email: "email",
//     password: "password",
// });

type Response = {
    hello: string;
    world: string;
}[];
export const destroy = api(
    { expose: true, method: "DELETE", path: "/test-users/:id" },
    async ({ id }: { id: string }): Promise<Response[]> => {
        return [{ hello: "jjjj", world: "world" }] as Response[];
    }
);
