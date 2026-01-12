import type { PlasmoMessaging } from "@plasmohq/messaging";
import { getCurrentSession, saveCurrentSession, getRemainingMinutes } from "~lib/storage";
import { createSession } from "~lib/timer";

export type StartSessionRequest = {
  durationMinutes: number;
};

export type StartSessionResponse = {
  success: boolean;
  error?: string;
  session?: any;
};

const handler: PlasmoMessaging.MessageHandler<
  StartSessionRequest,
  StartSessionResponse
> = async (req, res) => {
  try {
    const { durationMinutes } = req.body;

    // バリデーション: 時間が正の数であること
    if (!durationMinutes || durationMinutes <= 0) {
      res.send({
        success: false,
        error: "セッション時間は正の数である必要があります"
      });
      return;
    }

    // 既存のアクティブセッションがないかチェック
    const existingSession = await getCurrentSession();
    if (existingSession && existingSession.isActive) {
      res.send({
        success: false,
        error: "既にアクティブなセッションが存在します"
      });
      return;
    }

    // 残り利用可能時間をチェック
    const remainingMinutes = await getRemainingMinutes();
    if (durationMinutes > remainingMinutes) {
      res.send({
        success: false,
        error: `本日の残り利用可能時間は${remainingMinutes}分です`
      });
      return;
    }

    // 新しいセッションを作成
    const newSession = createSession(durationMinutes);
    await saveCurrentSession(newSession);

    res.send({
      success: true,
      session: newSession
    });
  } catch (error) {
    console.error("Error starting session:", error);
    res.send({
      success: false,
      error: "セッションの開始に失敗しました"
    });
  }
};

export default handler;
