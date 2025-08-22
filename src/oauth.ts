import * as vscode from "vscode";
import crypto from "crypto";
import { fetch } from "undici";

export type OAuthTokens = {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  expiry_ts?: number; // computed
};

type OAuthProviderCfg = {
  id: "vertex" | "github";
  authUrl: string;
  tokenUrl: string;
  scope: string;
  clientIdSettingKey: string; // e.g., aiCommitHelper.vertex.clientId
  state: string;
  extraAuthParams?: Record<string, string>;
};

export class OAuthManager implements vscode.UriHandler {
  private pending?:
    | {
        provider: OAuthProviderCfg;
        codeVerifier: string;
        resolve: (code: string) => void;
        reject: (err: unknown) => void;
      }
    | undefined;

  constructor(
    private context: vscode.ExtensionContext,
    private providers: Record<string, OAuthProviderCfg>
  ) {}

  // vscode deep-link callback
  handleUri = (uri: vscode.Uri) => {
    const params = new URLSearchParams(uri.query);
    const code = params.get("code");
    const state = params.get("state");
    if (!this.pending) return;
    if (!code || state !== this.pending.provider.state) {
      this.pending.reject(new Error("Invalid callback"));
      this.pending = undefined;
      return;
    }
    this.pending.resolve(code);
    this.pending = undefined;
  };

  async start(providerId: keyof typeof this.providers) {
    const provider = this.providers[providerId];
    if (!provider) throw new Error(`Unknown provider: ${providerId}`);

    const clientId = vscode.workspace
      .getConfiguration()
      .get<string>(provider.clientIdSettingKey);
    if (!clientId) {
      throw new Error(
        `Missing client ID in settings: ${provider.clientIdSettingKey}`
      );
    }

    const redirectUri = `vscode://${this.context.extension.id}/callback`;
    const { verifier, challenge } = pkcePair();

    const authParams = new URLSearchParams({
      response_type: "code",
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: provider.scope,
      code_challenge: challenge,
      code_challenge_method: "S256",
      state: provider.state,
      ...provider.extraAuthParams,
    } as Record<string, string>);

    const authUrl = `${provider.authUrl}?${authParams.toString()}`;

    const code = await new Promise<string>((resolve, reject) => {
      this.pending = { provider, codeVerifier: verifier, resolve, reject };
      vscode.env.openExternal(vscode.Uri.parse(authUrl));
    });

    const tokens = await this.exchangeCodeForTokens(
      provider,
      clientId,
      redirectUri,
      code,
      verifier
    );

    await this.storeTokens(provider.id, tokens);
    return tokens;
  }

  async exchangeCodeForTokens(
    provider: OAuthProviderCfg,
    clientId: string,
    redirectUri: string,
    code: string,
    verifier: string
  ): Promise<OAuthTokens> {
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: clientId,
      redirect_uri: redirectUri,
      code_verifier: verifier,
    });

    const res = await fetch(provider.tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`Token exchange failed: ${res.status} ${t}`);
    }
    const tokens = (await res.json()) as OAuthTokens;
    return withExpiry(tokens);
  }

  async refresh(providerId: string) {
    const provider = this.providers[providerId];
    const clientId = vscode.workspace
      .getConfiguration()
      .get<string>(provider.clientIdSettingKey);
    if (!clientId) throw new Error("Missing client ID");

    const current = await this.getTokens(providerId);
    if (!current?.refresh_token) throw new Error("No refresh token");

    const body = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: current.refresh_token,
      client_id: clientId,
    });

    const res = await fetch(provider.tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`Refresh failed: ${res.status} ${t}`);
    }
    const tokens = (await res.json()) as OAuthTokens;
    const merged = withExpiry({ ...current, ...tokens });
    await this.storeTokens(providerId, merged);
    return merged;
  }

  async getTokens(providerId: string): Promise<OAuthTokens | null> {
    const raw = await this.context.secrets.get(`aich.${providerId}.tokens`);
    return raw ? (JSON.parse(raw) as OAuthTokens) : null;
  }

  async storeTokens(providerId: string, tokens: OAuthTokens) {
    await this.context.secrets.store(
      `aich.${providerId}.tokens`,
      JSON.stringify(tokens)
    );
  }
}

function pkcePair() {
  const verifier = base64url(crypto.randomBytes(32));
  const challenge = base64url(
    crypto.createHash("sha256").update(verifier).digest()
  );
  return { verifier, challenge };
}

function base64url(buf: Buffer) {
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function withExpiry(t: OAuthTokens): OAuthTokens {
  const now = Math.floor(Date.now() / 1000);
  const expiresIn = t.expires_in ?? 3600;
  return { ...t, expiry_ts: now + expiresIn - 60 };
}
