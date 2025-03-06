import { api } from "encore.dev/api";
import { auth } from './encore.service';

interface SignInSocialParams {
  callbackURL?: string
  newUserCallbackURL?: string
  errorCallbackURL?: string
  provider: "apple" | "discord" | "facebook" | "github" | "microsoft" | "google" | "spotify" | "twitch" | "twitter" | "dropbox" | "linkedin" | "gitlab" | "tiktok" | "reddit" | "roblox" | "vk"
  disableRedirect?: boolean
  idToken?: any
  scopes?: any[]
  requestSignUp?: boolean
}
type SignInSocialResponse = {
  session: string
  user: any
  url: string
  redirect: boolean
};

// Sign in with a social provider
export const signInSocial = api(
  { method: ["POST"], path: "/sign-in/social", expose: true, tags: ["/sign-in/social"] },
  async (params: SignInSocialParams): Promise<{ data: SignInSocialResponse }> => {
    return await auth.routeHandlers.signInSocial(SignInSocialParams);
  }
);
interface CallbackOAuthParams {
  id: string
}

// API endpoint
export const callbackOAuth = api(
  { method: ["GET", "POST"], path: "/callback/:id", expose: true, tags: ["/callback/:id"] },
  async (params: CallbackOAuthParams): Promise<void> => {
    return await auth.routeHandlers.callbackOAuth(CallbackOAuthParams);
  }
);
type GetSessionResponse = {
  session?: any
  user?: any
};

// Get the current session
export const getSession = api(
  { method: ["GET"], path: "/get-session", expose: true, tags: ["/get-session"] },
  async (): Promise<{ data: GetSessionResponse }> => {
    return await auth.routeHandlers.getSession();
  }
);
type SignOutResponse = {
  success?: boolean
};

// Sign out the current user
export const signOut = api(
  { method: ["POST"], path: "/sign-out", expose: true, tags: ["/sign-out"] },
  async (): Promise<{ data: SignOutResponse }> => {
    return await auth.routeHandlers.signOut();
  }
);
type SignUpEmailResponse = {
  id?: string
  email?: string
  name?: string
  image?: string
  emailVerified?: boolean
};

// Sign up a user using email and password
export const signUpEmail = api(
  { method: ["POST"], path: "/sign-up/email", expose: true, tags: ["/sign-up/email"] },
  async (): Promise<{ data: SignUpEmailResponse }> => {
    return await auth.routeHandlers.signUpEmail();
  }
);
interface SignInEmailParams {
  email: string
  password: string
  callbackURL?: string
  rememberMe?: any
}
type SignInEmailResponse = {
  user: any
  url: string
  redirect: boolean
};

// Sign in with email and password
export const signInEmail = api(
  { method: ["POST"], path: "/sign-in/email", expose: true, tags: ["/sign-in/email"] },
  async (params: SignInEmailParams): Promise<{ data: SignInEmailResponse }> => {
    return await auth.routeHandlers.signInEmail(SignInEmailParams);
  }
);
interface ForgetPasswordParams {
  email: string
  redirectTo?: string
}
type ForgetPasswordResponse = {
  status?: boolean
};

// Send a password reset email to the user
export const forgetPassword = api(
  { method: ["POST"], path: "/forget-password", expose: true, tags: ["/forget-password"] },
  async (params: ForgetPasswordParams): Promise<{ data: ForgetPasswordResponse }> => {
    return await auth.routeHandlers.forgetPassword(ForgetPasswordParams);
  }
);
interface ResetPasswordParams {
  newPassword: string
  token?: string
}
type ResetPasswordResponse = {
  status?: boolean
};

// Reset the password for a user
export const resetPassword = api(
  { method: ["POST"], path: "/reset-password", expose: true, tags: ["/reset-password"] },
  async (params: ResetPasswordParams): Promise<{ data: ResetPasswordResponse }> => {
    return await auth.routeHandlers.resetPassword(ResetPasswordParams);
  }
);
interface VerifyEmailParams {
  token: string
  callbackURL?: string
}
type VerifyEmailResponse = {
  user: any
  status: boolean
};

// Verify the email of the user
export const verifyEmail = api(
  { method: ["GET"], path: "/verify-email", expose: true, tags: ["/verify-email"] },
  async (params: VerifyEmailParams): Promise<{ data: VerifyEmailResponse }> => {
    return await auth.routeHandlers.verifyEmail(VerifyEmailParams);
  }
);
interface SendVerificationEmailParams {
  email: string
  callbackURL?: string
}
type SendVerificationEmailResponse = {
  status?: boolean
};

// Send a verification email to the user
export const sendVerificationEmail = api(
  { method: ["POST"], path: "/send-verification-email", expose: true, tags: ["/send-verification-email"] },
  async (params: SendVerificationEmailParams): Promise<{ data: SendVerificationEmailResponse }> => {
    return await auth.routeHandlers.sendVerificationEmail(SendVerificationEmailParams);
  }
);
interface ChangeEmailParams {
  newEmail: string
  callbackURL?: string
}
type ChangeEmailResponse = {
  user?: any
  status?: boolean
};

// API endpoint
export const changeEmail = api(
  { method: ["POST"], path: "/change-email", expose: true, tags: ["/change-email"] },
  async (params: ChangeEmailParams): Promise<{ data: ChangeEmailResponse }> => {
    return await auth.routeHandlers.changeEmail(ChangeEmailParams);
  }
);
interface ChangePasswordParams {
  newPassword: string
  currentPassword: string
  revokeOtherSessions?: boolean
}
type ChangePasswordResponse = {
  user?: any
};

// Change the password of the user
export const changePassword = api(
  { method: ["POST"], path: "/change-password", expose: true, tags: ["/change-password"] },
  async (params: ChangePasswordParams): Promise<{ data: ChangePasswordResponse }> => {
    return await auth.routeHandlers.changePassword(ChangePasswordParams);
  }
);
type UpdateUserResponse = {
  user?: any
};

// Update the current user
export const updateUser = api(
  { method: ["POST"], path: "/update-user", expose: true, tags: ["/update-user"] },
  async (): Promise<{ data: UpdateUserResponse }> => {
    return await auth.routeHandlers.updateUser();
  }
);
interface DeleteUserParams {
  callbackURL?: string
  password?: string
  token?: string
}
type DeleteUserResponse = {

};

// Delete the user
export const deleteUser = api(
  { method: ["POST"], path: "/delete-user", expose: true, tags: ["/delete-user"] },
  async (params: DeleteUserParams): Promise<{ data: DeleteUserResponse }> => {
    return await auth.routeHandlers.deleteUser(DeleteUserParams);
  }
);
interface ForgetPasswordCallbackParams {
  token: string
  callbackURL: string
}
type ForgetPasswordCallbackResponse = {
  token?: string
};

// Redirects the user to the callback URL with the token
export const forgetPasswordCallback = api(
  { method: ["GET"], path: "/reset-password/:token", expose: true, tags: ["/reset-password/:token"] },
  async (params: ForgetPasswordCallbackParams): Promise<{ data: ForgetPasswordCallbackResponse }> => {
    return await auth.routeHandlers.forgetPasswordCallback(ForgetPasswordCallbackParams);
  }
);

// List all active sessions for the user
export const listSessions = api(
  { method: ["GET"], path: "/list-sessions", expose: true, tags: ["/list-sessions"] },
  async (): Promise<{ data: any }> => {
    return await auth.routeHandlers.listSessions();
  }
);
interface RevokeSessionParams {
  token: string
}

// Revoke a single session
export const revokeSession = api(
  { method: ["POST"], path: "/revoke-session", expose: true, tags: ["/revoke-session"] },
  async (params: RevokeSessionParams): Promise<void> => {
    return await auth.routeHandlers.revokeSession(RevokeSessionParams);
  }
);
type RevokeSessionsResponse = {
  status: boolean
};

// Revoke all sessions for the user
export const revokeSessions = api(
  { method: ["POST"], path: "/revoke-sessions", expose: true, tags: ["/revoke-sessions"] },
  async (): Promise<{ data: RevokeSessionsResponse }> => {
    return await auth.routeHandlers.revokeSessions();
  }
);
type RevokeOtherSessionsResponse = {
  status?: boolean
};

// Revoke all other sessions for the user except the current one
export const revokeOtherSessions = api(
  { method: ["POST"], path: "/revoke-other-sessions", expose: true, tags: ["/revoke-other-sessions"] },
  async (): Promise<{ data: RevokeOtherSessionsResponse }> => {
    return await auth.routeHandlers.revokeOtherSessions();
  }
);
interface LinkSocialAccountParams {
  callbackURL?: string
  provider: "apple" | "discord" | "facebook" | "github" | "microsoft" | "google" | "spotify" | "twitch" | "twitter" | "dropbox" | "linkedin" | "gitlab" | "tiktok" | "reddit" | "roblox" | "vk"
}
type LinkSocialAccountResponse = {
  url: string
  redirect: boolean
};

// Link a social account to the user
export const linkSocialAccount = api(
  { method: ["POST"], path: "/link-social", expose: true, tags: ["/link-social"] },
  async (params: LinkSocialAccountParams): Promise<{ data: LinkSocialAccountResponse }> => {
    return await auth.routeHandlers.linkSocialAccount(LinkSocialAccountParams);
  }
);

// List all accounts linked to the user
export const listUserAccounts = api(
  { method: ["GET"], path: "/list-accounts", expose: true, tags: ["/list-accounts"] },
  async (): Promise<{ data: any }> => {
    return await auth.routeHandlers.listUserAccounts();
  }
);
interface DeleteUserCallbackParams {
  token: string
  callbackURL?: string
}

// API endpoint
export const deleteUserCallback = api(
  { method: ["GET"], path: "/delete-user/callback", expose: true, tags: ["/delete-user/callback"] },
  async (params: DeleteUserCallbackParams): Promise<void> => {
    return await auth.routeHandlers.deleteUserCallback(DeleteUserCallbackParams);
  }
);
interface UnlinkAccountParams {
  providerId: string
}

// API endpoint
export const unlinkAccount = api(
  { method: ["POST"], path: "/unlink-account", expose: true, tags: ["/unlink-account"] },
  async (params: UnlinkAccountParams): Promise<void> => {
    return await auth.routeHandlers.unlinkAccount(UnlinkAccountParams);
  }
);
interface CreateApiKeyParams {
  name?: string
  expiresIn: any
  userId?: string
  prefix?: string
  remaining: any
  metadata?: any
  refillAmount?: number
  refillInterval?: number
  rateLimitTimeWindow?: number
  rateLimitMax?: number
  rateLimitEnabled?: boolean
  permissions?: any
}

// API endpoint
export const createApiKey = api(
  { method: ["POST"], path: "/api-key/create", expose: true, tags: ["/api-key/create"] },
  async (params: CreateApiKeyParams): Promise<void> => {
    return await auth.routeHandlers.createApiKey(CreateApiKeyParams);
  }
);
interface GetApiKeyParams {
  id: string
}

// API endpoint
export const getApiKey = api(
  { method: ["GET"], path: "/api-key/get", expose: true, tags: ["/api-key/get"] },
  async (params: GetApiKeyParams): Promise<void> => {
    return await auth.routeHandlers.getApiKey(GetApiKeyParams);
  }
);
interface UpdateApiKeyParams {
  keyId: string
  userId?: string
  name?: string
  enabled?: boolean
  remaining?: number
  refillAmount?: number
  refillInterval?: number
  metadata?: any
  expiresIn?: any
  rateLimitEnabled?: boolean
  rateLimitTimeWindow?: number
  rateLimitMax?: number
  permissions?: any
}

// API endpoint
export const updateApiKey = api(
  { method: ["POST"], path: "/api-key/update", expose: true, tags: ["/api-key/update"] },
  async (params: UpdateApiKeyParams): Promise<void> => {
    return await auth.routeHandlers.updateApiKey(UpdateApiKeyParams);
  }
);
interface DeleteApiKeyParams {
  keyId: string
}

// API endpoint
export const deleteApiKey = api(
  { method: ["DELETE"], path: "/api-key/delete", expose: true, tags: ["/api-key/delete"] },
  async (params: DeleteApiKeyParams): Promise<void> => {
    return await auth.routeHandlers.deleteApiKey(DeleteApiKeyParams);
  }
);

// API endpoint
export const listApiKeys = api(
  { method: ["GET"], path: "/api-key/list", expose: true, tags: ["/api-key/list"] },
  async (): Promise<void> => {
    return await auth.routeHandlers.listApiKeys();
  }
);
type OkResponse = {
  ok?: boolean
};

// Check if the API is working
export const ok = api(
  { method: ["GET"], path: "/ok", expose: true, tags: ["/ok"] },
  async (): Promise<{ data: OkResponse }> => {
    return await auth.routeHandlers.ok();
  }
);

// Displays an error page
export const error = api(
  { method: ["GET"], path: "/error", expose: true, tags: ["/error"] },
  async (): Promise<void> => {
    return await auth.routeHandlers.error();
  }
);