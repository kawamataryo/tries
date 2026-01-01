import { useEffect, useState } from "react";
import { LoginButton } from "./components/LoginButton";
import { PostForm } from "./components/PostForm";
import { initializeAuth } from "./lib/blueskyAuth";
import type { OAuthSession } from "@atproto/oauth-client";

function App() {
  const [session, setSession] = useState<OAuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        const authSession = await initializeAuth();
        setSession(authSession);
        // URLパラメータをクリア
        const params = new URLSearchParams(window.location.search);
        if (params.has("code") || params.has("state")) {
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      } catch (error) {
        console.error("Failed to initialize auth:", error);
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="flex flex-col items-center justify-center space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold tracking-tight">Bluesky OAuth App</h1>
            <p className="text-muted-foreground">
              Blueskyにログインして投稿しましょう
            </p>
          </div>

          {session ? (
            <PostForm />
          ) : (
            <div className="flex flex-col items-center space-y-4">
              <LoginButton />
              <p className="text-sm text-muted-foreground">
                ログインすると、Blueskyに投稿できるようになります
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
