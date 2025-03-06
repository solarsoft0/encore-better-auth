import { api } from "encore.dev/api";
import { Service } from "encore.dev/service";
import { apiKey } from "better-auth/plugins";
import { encoreBetterAuth } from "encore-better-auth";
import { currentRequest } from 'encore.dev';


// ensure to export auth.
export const auth = encoreBetterAuth({
    currentRequest: currentRequest,
    plugins: [
        apiKey({
            rateLimit: {
                enabled: true,
                timeWindow: 1000 * 60 * 60 * 24, // 1 day
                maxRequests: 10, // 10 requests per day
            },
        }),
    ],
    generateRoutes: true,
    wrapResponse: true,
});



// Encore will consider this directory and all its subdirectories as part of the "users" service.
// https://encore.dev/docs/ts/primitives/services
export default new Service("auth", {
    middlewares: [
        ...auth.middlewares,
    ],
});


type OkParams = {
	data: any;
};
type OkResponse = {
    data: any;
}
export const authOk = api(
	{ expose: true, method: "POST", path: "/auth/ok" },
	async (params: OkParams): Promise<OkResponse> => {
		// auth.routeHandlers.callbackOAuth()
		return (await auth.routeHandlers.ok()) as OkResponse;
	},
);
