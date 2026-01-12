import type { PlasmoMessaging } from "@plasmohq/messaging";
import { getCurrentSession } from "~lib/storage";

export type GetSessionStateRequest = {};

export type GetSessionStateResponse = {
  session: any | null;
};

const handler: PlasmoMessaging.MessageHandler<
  GetSessionStateRequest,
  GetSessionStateResponse
> = async (req, res) => {
  try {
    const session = await getCurrentSession();
    res.send({ session });
  } catch (error) {
    console.error("Error getting session state:", error);
    res.send({ session: null });
  }
};

export default handler;
