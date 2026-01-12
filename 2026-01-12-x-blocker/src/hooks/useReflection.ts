import { useState } from "react";
import { sendToBackground } from "@plasmohq/messaging";

export function useReflection() {
  const [reflection, setReflection] = useState("");
  const [reflectionLoading, setReflectionLoading] = useState(false);
  const [reflectionError, setReflectionError] = useState("");

  // 振り返り保存
  const handleSaveReflection = async () => {
    if (!reflection.trim()) {
      setReflectionError("振り返り内容を入力してください");
      return;
    }

    setReflectionLoading(true);
    setReflectionError("");

    try {
      const response = await sendToBackground({
        name: "save-reflection",
        body: { reflection: reflection.trim() },
      });

      if (response.success) {
        // デフォルトビューに戻る
        window.location.href = chrome.runtime.getURL("options.html");
      } else {
        setReflectionError(response.error || "振り返りの保存に失敗しました");
      }
    } catch (err) {
      console.error("Error saving reflection:", err);
      setReflectionError("振り返りの保存に失敗しました");
    } finally {
      setReflectionLoading(false);
    }
  };

  return {
    reflection,
    setReflection,
    reflectionLoading,
    reflectionError,
    handleSaveReflection,
  };
}
