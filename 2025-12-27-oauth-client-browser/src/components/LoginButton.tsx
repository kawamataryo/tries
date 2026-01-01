import { useState } from "react";
import { Button } from "@/components/ui/button";
import { signIn } from "@/lib/blueskyAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function LoginButton() {
  const [handle, setHandle] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (!handle.trim()) {
      alert("BlueskyのハンドルまたはDIDを入力してください");
      return;
    }

    setIsLoading(true);
    try {
      await signIn(handle.trim());
    } catch (error) {
      console.error("Failed to sign in:", error);
      alert("ログインに失敗しました");
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Blueskyでログイン</CardTitle>
        <CardDescription>
          ハンドルまたはDIDを入力してください
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="text"
            placeholder="example.bsky.social または did:plc:..."
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            className="w-full px-3 py-2 border border-input bg-background rounded-md"
            disabled={isLoading}
          />
          <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
            {isLoading ? "ログイン中..." : "ログイン"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

