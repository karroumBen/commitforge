import type { OAuthTokens } from "./oauth";

export type ProviderId = "openai" | "gemini" | "vertex" | "github" | "ollama";

export const OAUTH_PROVIDERS = {
  vertex: {
    id: "vertex",
    authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    scope: "https://www.googleapis.com/auth/cloud-platform",
    clientIdSettingKey: "aiCommitHelper.vertex.clientId",
    state: "vertex"
  },
  github: {
    id: "github",
    authUrl: "https://github.com/login/oauth/authorize",
    tokenUrl: "https://github.com/login/oauth/access_token",
    scope: "read:user",
    clientIdSettingKey: "aiCommitHelper.github.clientId",
    state: "github",
    extraAuthParams: { allow_signup: "true" }
  }
} as const;
