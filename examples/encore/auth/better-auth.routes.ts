import { api } from "encore.dev/api";

// Sign in with a social provider
export const signInSocial = api(
  { method: ["POST"], path: "/sign-in/social", expose: true },
  async (params: {}): Promise<void> => {
    // Implement your logic here
    throw new Error("Not implemented");
  },
);

interface CallbackOAuthParams {
  id: string; // Path parameter
}


// Handles callbackOAuth request
export const callbackOAuth = api(
  { method: ["GET", "POST"], path: "/callback/:id", expose: true },
  async (params: CallbackOAuthParams): Promise<void> => {
    // Implement your logic here
    throw new Error("Not implemented");
  },
);

interface GetSessionParams {
  id?: string; // The ID of the resource
}


interface GetSessionResponse {
  session?: Record<string, any>;
  user?: Record<string, any>;
}


// Get the current session
export const getSession = api(
  { method: ["GET"], path: "/get-session", expose: true },
  async (params: GetSessionParams): Promise<GetSessionResponse> => {
    // Implement your logic here
    throw new Error("Not implemented");
  },
);

// Sign out the current user
export const signOut = api(
  { method: ["POST"], path: "/sign-out", expose: true },
  async (params: {}): Promise<void> => {
    // Implement your logic here
    throw new Error("Not implemented");
  },
);

// Sign up a user using email and password
export const signUpEmail = api(
  { method: ["POST"], path: "/sign-up/email", expose: true },
  async (params: {}): Promise<void> => {
    // Implement your logic here
    throw new Error("Not implemented");
  },
);

// Sign in with email and password
export const signInEmail = api(
  { method: ["POST"], path: "/sign-in/email", expose: true },
  async (params: {}): Promise<void> => {
    // Implement your logic here
    throw new Error("Not implemented");
  },
);

// Send a password reset email to the user
export const forgetPassword = api(
  { method: ["POST"], path: "/forget-password", expose: true },
  async (params: {}): Promise<void> => {
    // Implement your logic here
    throw new Error("Not implemented");
  },
);

// Reset the password for a user
export const resetPassword = api(
  { method: ["POST"], path: "/reset-password", expose: true },
  async (params: {}): Promise<void> => {
    // Implement your logic here
    throw new Error("Not implemented");
  },
);

interface VerifyEmailParams {
  token: string;
  callbackURL?: string;
}


// Verify the email of the user
export const verifyEmail = api(
  { method: ["GET"], path: "/verify-email", expose: true },
  async (params: VerifyEmailParams): Promise<void> => {
    // Implement your logic here
    throw new Error("Not implemented");
  },
);

// Send a verification email to the user
export const sendVerificationEmail = api(
  { method: ["POST"], path: "/send-verification-email", expose: true },
  async (params: {}): Promise<void> => {
    // Implement your logic here
    throw new Error("Not implemented");
  },
);

// Handles changeEmail request
export const changeEmail = api(
  { method: ["POST"], path: "/change-email", expose: true },
  async (params: {}): Promise<void> => {
    // Implement your logic here
    throw new Error("Not implemented");
  },
);

// Change the password of the user
export const changePassword = api(
  { method: ["POST"], path: "/change-password", expose: true },
  async (params: {}): Promise<void> => {
    // Implement your logic here
    throw new Error("Not implemented");
  },
);

interface UpdateUserResponse {
  user?: Record<string, any>;
}


// Update the current user
export const updateUser = api(
  { method: ["POST"], path: "/update-user", expose: true },
  async (params: {}): Promise<UpdateUserResponse> => {
    // Implement your logic here
    throw new Error("Not implemented");
  },
);

interface DeleteUserResponse {
  data: object;
}


// Delete the user
export const deleteUser = api(
  { method: ["POST"], path: "/delete-user", expose: true },
  async (params: {}): Promise<DeleteUserResponse> => {
    // Implement your logic here
    throw new Error("Not implemented");
  },
);

interface ForgetPasswordCallbackParams {
  token: string; // Path parameter
  id?: string; // The ID of the resource
  callbackURL: string;
}


// Redirects the user to the callback URL with the token
export const forgetPasswordCallback = api(
  { method: ["GET"], path: "/reset-password/:token", expose: true },
  async (params: ForgetPasswordCallbackParams): Promise<void> => {
    // Implement your logic here
    throw new Error("Not implemented");
  },
);

interface ListSessionsParams {
  id?: string; // The ID of the resource
}


interface ListSessionsResponse {
  data: {}[];
}


// List all active sessions for the user
export const listSessions = api(
  { method: ["GET"], path: "/list-sessions", expose: true },
  async (params: ListSessionsParams): Promise<ListSessionsResponse> => {
    // Implement your logic here
    throw new Error("Not implemented");
  },
);

interface RevokeSessionResponse {
  session?: {};
}


// Revoke a single session
export const revokeSession = api(
  { method: ["POST"], path: "/revoke-session", expose: true },
  async (params: {}): Promise<RevokeSessionResponse> => {
    // Implement your logic here
    throw new Error("Not implemented");
  },
);

interface RevokeSessionsResponse {
  status: boolean;
}


// Revoke all sessions for the user
export const revokeSessions = api(
  { method: ["POST"], path: "/revoke-sessions", expose: true },
  async (params: {}): Promise<RevokeSessionsResponse> => {
    // Implement your logic here
    throw new Error("Not implemented");
  },
);

interface RevokeOtherSessionsResponse {
  status?: boolean;
}


// Revoke all other sessions for the user except the current one
export const revokeOtherSessions = api(
  { method: ["POST"], path: "/revoke-other-sessions", expose: true },
  async (params: {}): Promise<RevokeOtherSessionsResponse> => {
    // Implement your logic here
    throw new Error("Not implemented");
  },
);

// Link a social account to the user
export const linkSocialAccount = api(
  { method: ["POST"], path: "/link-social", expose: true },
  async (params: {}): Promise<void> => {
    // Implement your logic here
    throw new Error("Not implemented");
  },
);

interface ListUserAccountsParams {
  id?: string; // The ID of the resource
}


interface ListUserAccountsResponse {
  data: {}[];
}


// List all accounts linked to the user
export const listUserAccounts = api(
  { method: ["GET"], path: "/list-accounts", expose: true },
  async (params: ListUserAccountsParams): Promise<ListUserAccountsResponse> => {
    // Implement your logic here
    throw new Error("Not implemented");
  },
);

interface DeleteUserCallbackParams {
  token: string;
  callbackURL?: string;
}


interface DeleteUserCallbackResponse {
  user?: {};
}


// Handles deleteUserCallback request
export const deleteUserCallback = api(
  { method: ["GET"], path: "/delete-user/callback", expose: true },
  async (params: DeleteUserCallbackParams): Promise<DeleteUserCallbackResponse> => {
    // Implement your logic here
    throw new Error("Not implemented");
  },
);

interface UnlinkAccountResponse {
  account?: {};
}


// Handles unlinkAccount request
export const unlinkAccount = api(
  { method: ["POST"], path: "/unlink-account", expose: true },
  async (params: {}): Promise<UnlinkAccountResponse> => {
    // Implement your logic here
    throw new Error("Not implemented");
  },
);

// Check if the API is working
export const ok = api(
  { method: ["GET"], path: "/ok", expose: true },
  async (params: {}): Promise<void> => {
    // Implement your logic here
    throw new Error("Not implemented");
  },
);

// Displays an error page
export const error = api(
  { method: ["GET"], path: "/error", expose: true },
  async (params: {}): Promise<void> => {
    // Implement your logic here
    throw new Error("Not implemented");
  },
);

// Handles createApiKey request
export const createApiKey = api(
  { method: ["POST"], path: "/api-key/create", expose: true },
  async (params: {}): Promise<void> => {
    // Implement your logic here
    throw new Error("Not implemented");
  },
);

interface GetApiKeyParams {
  id?: string; // The ID of the resource
}


// Handles getApiKey request
export const getApiKey = api(
  { method: ["GET"], path: "/api-key/get", expose: true },
  async (params: GetApiKeyParams): Promise<void> => {
    // Implement your logic here
    throw new Error("Not implemented");
  },
);

// Handles updateApiKey request
export const updateApiKey = api(
  { method: ["POST"], path: "/api-key/update", expose: true },
  async (params: {}): Promise<void> => {
    // Implement your logic here
    throw new Error("Not implemented");
  },
);

// Handles deleteApiKey request
export const deleteApiKey = api(
  { method: ["DELETE"], path: "/api-key/delete", expose: true },
  async (params: {}): Promise<void> => {
    // Implement your logic here
    throw new Error("Not implemented");
  },
);

interface ListApiKeysParams {
  id?: string; // The ID of the resource
}


// Handles listApiKeys request
export const listApiKeys = api(
  { method: ["GET"], path: "/api-key/list", expose: true },
  async (params: ListApiKeysParams): Promise<void> => {
    // Implement your logic here
    throw new Error("Not implemented");
  },
);