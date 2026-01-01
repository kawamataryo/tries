import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createPost } from "@/lib/blueskyClient";
import { signOut, getCurrentSession } from "@/lib/blueskyAuth";

export function PostForm() {
  const [text, setText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const session = getCurrentSession();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!text.trim()) {
      alert("投稿内容を入力してください");
      return;
    }

    if (!session) {
      alert("ログインが必要です");
      return;
    }

    setIsSubmitting(true);
    try {
      await createPost(session, text);
      setText("");
      alert("投稿が完了しました！");
    } catch (error) {
      console.error("Failed to create post:", error);
      alert("投稿に失敗しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      window.location.reload();
    } catch (error) {
      console.error("Failed to sign out:", error);
      alert("ログアウトに失敗しました");
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Blueskyに投稿</CardTitle>
            <CardDescription>
              {session && `ログイン中: ${session.did}`}
            </CardDescription>
          </div>
          <Button variant="outline" onClick={handleSignOut}>
            ログアウト
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea
            placeholder="何を考えていますか？"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={6}
            maxLength={300}
            disabled={isSubmitting}
          />
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {text.length}/300
            </span>
            <Button type="submit" disabled={isSubmitting || !text.trim()}>
              {isSubmitting ? "投稿中..." : "投稿"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

