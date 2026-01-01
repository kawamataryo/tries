import type { OAuthSession } from "@atproto/oauth-client";

export async function createPost(
  session: OAuthSession,
  text: string
): Promise<void> {
  try {
    const response = await session.fetchHandler(
      `/xrpc/com.atproto.repo.createRecord`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          repo: session.did,
          collection: "app.bsky.feed.post",
          record: {
            $type: "app.bsky.feed.post",
            text: text.trim(),
            createdAt: new Date().toISOString(),
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Unknown error" }));
      throw new Error(`Failed to create post: ${error.message || response.statusText}`);
    }
  } catch (error) {
    console.error("Failed to create post:", error);
    throw error;
  }
}
