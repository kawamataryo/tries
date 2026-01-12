import type { PlasmoMessaging } from "@plasmohq/messaging";
import { getCurrentSession, saveCurrentSession } from "~lib/storage";

export type EndSessionRequest = {};

export type EndSessionResponse = {
  success: boolean;
  error?: string;
};

const handler: PlasmoMessaging.MessageHandler<
  EndSessionRequest,
  EndSessionResponse
> = async (req, res) => {
  try {
    const currentSession = await getCurrentSession();

    if (!currentSession) {
      res.send({
        success: false,
        error: "アクティブなセッションがありません"
      });
      return;
    }

    // セッションを非アクティブに設定
    const updatedSession = {
      ...currentSession,
      isActive: false,
    };

    await saveCurrentSession(updatedSession);

    res.send({ success: true });
  } catch (error) {
    console.error("Error ending session:", error);
    res.send({
      success: false,
      error: "セッションの終了に失敗しました"
    });
  }
};

export default handler;
