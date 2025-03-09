**Note:** Encore BetterAuth is not compatible with BetterAuth Client due to this [issue.](https://github.com/better-auth/better-auth/issues/1655), i may provide a client patch.


<p align="center">
  <picture>
    <source srcset="https://github.com/better-auth/better-auth/blob/main/banner-dark.png?raw=true" media="(prefers-color-scheme: dark)">
    <source srcset="https://github.com/better-auth/better-auth/blob/main/banner.png?raw=true" media="(prefers-color-scheme: light)">
    <img src="https://github.com/better-auth/better-auth/blob/main/banner.png?raw=true" alt="Better Auth Logo">
  </picture>
  <h2 align="center">Encore Better Auth</h2>
  <p align="center">
    The most comprehensive authentication library, Better Auth, is now available for Encore TypeScript.
    <br />
    <a href="https://better-auth.com"><strong>Learn more »</strong></a>
    <br /><br />
    <a href="https://discord.com/invite/GYC3W7tZzb">Discord</a> · 
    <a href="https://better-auth.com">Website</a> · 
    <a href="https://github.com/better-auth/better-auth/issues">Issues</a>
  </p>
</p>

## Overview

`encore-better-auth` is a wrapper of `better-auth` specifically for Encore TypeScript applications. It extends the core functionality of `better-auth` with integration into Encore’s service architecture and includes an automatic route file generator for endpoints.

## Getting Started

### Prerequisites
- Node.js and `pnpm` installed.
- An Encore TypeScript project set up (see [Encore Docs](https://encore.dev/docs/ts)).
- A database (e.g., SQLite, MySQL, PostgreSQL) like you would with better-auth

### Installation
Install `encore-better-auth` and its dependencies:

```bash
pnpm install encore-better-auth better-auth encore.dev <p align="center">
```
### Setup

#### Configure Your Authentication Service

1. Create an `auth.ts` file in your Encore service directory (e.g., `services/auth/auth.ts`)
2. Set up encore-better-auth using the following template:


### Setting Up Your Authentication Service

To configure your authentication service using `encore-better-auth`, follow these steps:

1. **Import Required Modules:**

   Begin by importing the necessary modules and dependencies, you can use any database adapter, we would use Prisma here for demonstration.

   ```typescript
   import { prismaAdapter } from "better-auth/adapters/prisma";
   import { apiKey, username } from "better-auth/plugins";
   import { encoreBetterAuth } from "encore-better-auth";
   import { currentRequest } from "encore.dev";
   import { Service } from "encore.dev/service";
   import { prisma } from "./database"; // Your Prisma client
   ```

2. **Initialize the Authentication Instance:**

   Create and export the authentication instance using `encoreBetterAuth`:

   ```typescript
   export const auth = encoreBetterAuth({
     currentRequest: currentRequest,
     database: prismaAdapter(prisma, {
       provider: "sqlite", // Adjust to your database (e.g., "mysql", "postgresql")
     }),
     emailAndPassword: {
       enabled: true,
     },
     basePath: "/auth",
     plugins: [
       username(),
     ],
     generateRoutes: true, // Automatically generates Encore route files
     wrapResponse: true, // Required for Encore compatibility
   });
   ```

3. **Define the Service:**

   Finally, define and export the service, incorporating the authentication middlewares:

   ```typescript
   export default new Service("auth", {
     middlewares: [...auth.middlewares],
   });
   `

## Set Up Authentication Handler

To integrate authentication into your Encore service, follow these steps to set up an authentication handler and gateway:

1. **Import Necessary Modules:**

   Begin by importing the required modules from `encore.dev/api` and your authentication setup:

   ```typescript
   import { authHandler, Gateway, Header } from "encore.dev/api";
   import * as encoreAuth from "~encore/auth";
   ```

2. **Define Interfaces:**

   Define the interfaces for the authentication parameters and data:

   ```typescript
   interface AuthParams {
     cookie: Header<"Cookie">;
   }

   interface AuthData {
     userID: string;
     user: any;
     session: any;
   }
   ```

3. **Create the Authentication Handler:**

   Use the `authHandler` to create a handler that validates the session using the provided cookie:

   ```typescript
   export const handler = authHandler<AuthParams, AuthData>(async (authData) => {
     return auth.getValidatedSession(authData.cookie);
   });
   ```

4. **Set Up the Gateway:**

   Establish a gateway to manage the authentication handler:

   ```typescript
   export const gateway = new Gateway({ authHandler: handler });
   ```

## Add a Sample Endpoint

Create an authenticated endpoint, such as a `/me` route, to retrieve user information:

1. **Import Required Modules:**

   Import the necessary modules for API creation and error handling:

   ```typescript
   import { api, APIError } from "encore.dev/api";
   import * as encoreAuth from "~encore/auth";
   ```

2. **Define the Response Interface:**

   Define the structure of the response data:

   ```typescript
   interface MeResponse {
     session: any;
     user: any;
   }
   ```

3. **Create the `/me` Endpoint:**

   Implement the `/me` endpoint to return authenticated user data:

   ```typescript
   export const me = api(
     {
       method: ["GET"],
       path: "/me",
       expose: true,
       auth: true,
     },
     async (): Promise<{ data: MeResponse }> => {
       const authData = encoreAuth.getAuthData();
       if (!authData) {
         throw APIError.unauthenticated("Unauthenticated");
       }
       return {
         data: {
           session: authData.session,
           user: authData.user,
         },
       };
     }
   );
   ```

By following these steps, you will have successfully set up better-auth for Encore.

## Route Generator Plugin

The `encore-better-auth` library includes a route generation feature that automatically creates an Encore routes file containing all routes for better-auth endpoints. This feature is controlled by the `generateRoutes` option and can be customized using generator plugins. Generator plugins help ensure that routes are updated even when new plugins that introduce additional data to query or body are activated.

While we strive to support native cases, there may be scenarios where you need to customize the generated routes.

### Example: Custom Sign-Up Email Plugin

You can create custom generator plugins to modify the generated routes. Below is an example of a plugin that customizes the `signUpEmail` endpoint:


```typescript
import { createPlugin, generateParamsFromOptions } from "encore-better-auth"; 
import { BetterAuthOptions } from "better-auth";

export const createSignUpEmailPlugin = (authOptions: BetterAuthOptions) => {
  return createPlugin(
    {
      name: "signUpEmailPlugin",
      selector: (def) => def.name === "signUpEmail",
      verbose: true,
    },
    (definition) => {
      const additionalParams = generateParamsFromOptions(authOptions, "user", "update");
      const params: FieldDefinition[] = [
        { name: "name", type: "string", optional: false },
        { name: "email", type: "string", optional: false },
        { name: "password", type: "string", optional: false },
        ...additionalParams,
      ];

      const response: FieldDefinition[] = [
        { name: "token", type: "null", optional: false },
        {
          name: "user",
          type: [
            { name: "id", type: "string", optional: false },
            { name: "email", type: "string", optional: false },
            { name: "name", type: "string", optional: false },
            { name: "image", type: "string | null | undefined", optional: true },
            { name: "emailVerified", type: "boolean", optional: false },
            { name: "createdAt", type: "Date", optional: false },
            { name: "updatedAt", type: "Date", optional: false },
            ...additionalParams,
          ],
          optional: false,
        },
      ];

      return {
        ...definition,
        params,
        response,
      };
    },
  );
};
```
  
## Contribution

Encore Better Auth is free and open source project licensed under the [MIT License](./LICENSE.md). You are free to do whatever you want with it.

You could help continuing its development by:

- [Contribute to the source code](./CONTRIBUTING.md)
- [Suggest new features and report issues](https://github.com/solarsoft0/encore-better-auth/issues)

## Security
If you discover a security vulnerability in Better Auth, please email us at security@better-auth.com. For issues related to Encore Better Auth, please contact me on the Encore Discord with the username: solar.

All security reports will be promptly addressed, and you will be credited accordingly for your contributions.

## Acknowledgements

This project would not exist without the contributions and support of the following amazing projects and teams:

- The Better Auth team for creating and maintaining the core library.
- The Encore team for their excellent TypeScript framework and comprehensive documentation.

Your contributions and support are greatly appreciated!
