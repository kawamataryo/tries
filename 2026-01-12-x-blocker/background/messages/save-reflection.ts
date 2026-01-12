import type { PlasmoMessaging } from "@plasmohq/messaging";
import { getCurrentSession, saveCurrentSession, addSessionRecord } from "~lib/storage";
import { getElapsedMinutes } from "~lib/timer";
import type { SessionRecord } from "~lib/types";

export type SaveReflectionRequest = {
  reflection: string;
};

export type SaveReflectionResponse = {
  success: boolean;
  error?: string;
};

const handler: PlasmoMessaging.MessageHandler<
  SaveReflectionRequest,
  SaveReflectionResponse
> = async (req, res) => {
  try {
    const { reflection } = req.body;

    // バリデーション: 振り返り内容が空でないこと
    if (!reflection || reflection.trim().length === 0) {
      res.send({
        success: false,
        error: "振り返り内容を入力してください"
      });
      return;
    }

    const currentSession = await getCurrentSession();

    if (!currentSession) {
      res.send({
        success: false,
        error: "セッションが見つかりません"
      });
      return;
    }

    // セッション記録を作成
    const record: SessionRecord = {
      id: currentSession.id,
      startTime: currentSession.startTime,
      endTime: Date.now(),
      durationMinutes: getElapsedMinutes(currentSession),
      reflection: reflection.trim(),
    };

    // 記録を保存
    await addSessionRecord(record);

    // 現在のセッションをクリア
    await saveCurrentSession(null);

    res.send({ success: true });
  } catch (error) {
    console.error("Error saving reflection:", error);
    res.send({
      success: false,
      error: "振り返りの保存に失敗しました"
    });
  }
};

export default handler;
