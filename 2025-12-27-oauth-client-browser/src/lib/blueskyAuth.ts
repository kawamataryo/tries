import { BrowserOAuthClient, buildLoopbackClientId } from "@atproto/oauth-client-browser";
import type { OAuthSession } from "@atproto/oauth-client";
import type { OAuthClientMetadataInput } from "@atproto/oauth-types";

// loopbackの場合のredirect_uri（localhostを127.0.0.1に変換）
const getRedirectUri = (): string => {
  const origin = window.location.origin;
  // localhostを127.0.0.1に変換（RFC 8252準拠）
  if (origin.includes('localhost')) {
    return origin.replace('localhost', '127.0.0.1');
  }
  return origin;
};

const redirectUri = import.meta.env.VITE_OAUTH_REDIRECT_URI || getRedirectUri();

// クライアントメタデータ（開発環境用 - loopback）
const getClientMetadata = (): OAuthClientMetadataInput => {
  // loopbackの場合は、buildLoopbackClientIdを使用してclient_idを構築
  const clientId = buildLoopbackClientId(window.location);
  
  return {
    client_id: clientId,
    client_name: "Bluesky OAuth App",
    client_uri: redirectUri,
    redirect_uris: [redirectUri],
    scope: "atproto",
    grant_types: ["authorization_code", "refresh_token"],
    response_types: ["code"],
    token_endpoint_auth_method: "none",
    application_type: "web",
    dpop_bound_access_tokens: true,
  };
};

let client: BrowserOAuthClient | null = null;
let currentSession: OAuthSession | null = null;

export function getOAuthClient(): BrowserOAuthClient {
  if (!client) {
    // loopbackの場合、buildLoopbackClientIdを使用してclient_idを構築
    const clientMetadata = getClientMetadata();
    
    client = new BrowserOAuthClient({
      clientMetadata,
      handleResolver: "https://bsky.social",
    });
  }

  return client;
}

export async function initializeAuth(): Promise<OAuthSession | null> {
  try {
    const oauthClient = getOAuthClient();
    const result = await oauthClient.init();
    
    if (result?.session) {
      currentSession = result.session;
      return result.session;
    }
    
    return null;
  } catch (error) {
    console.error("Failed to initialize auth:", error);
    return null;
  }
}

export async function signIn(identifier?: string): Promise<void> {
  try {
    const oauthClient = getOAuthClient();
    // signInRedirect requires an identifier (handle or DID) as first parameter
    // If identifier is not provided, we'll use a prompt or redirect to handle entry
    // For now, we require the identifier to be provided
    if (!identifier) {
      // In a real app, you might want to show a form to enter the handle
      // For now, we'll throw an error or use a default
      throw new Error("Identifier (handle or DID) is required for sign in");
    }
    
    const redirectUrl = oauthClient.findRedirectUrl() || redirectUri;
    await oauthClient.signInRedirect(identifier, {
      redirect_uri: redirectUrl,
    });
  } catch (error) {
    console.error("Failed to sign in:", error);
    throw error;
  }
}

export async function signOut(): Promise<void> {
  try {
    if (currentSession?.sub) {
      const oauthClient = getOAuthClient();
      await oauthClient.revoke(currentSession.sub);
    }
    currentSession = null;
  } catch (error) {
    console.error("Failed to sign out:", error);
    throw error;
  }
}

export function getCurrentSession(): OAuthSession | null {
  return currentSession;
}

export async function refreshSession(): Promise<OAuthSession | null> {
  try {
    const oauthClient = getOAuthClient();
    const result = await oauthClient.init(true);
    
    if (result?.session) {
      currentSession = result.session;
      return result.session;
    }
    
    return null;
  } catch (error) {
    console.error("Failed to refresh session:", error);
    return null;
  }
}

