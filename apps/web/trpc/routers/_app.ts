import { router } from "../init";
import { conversationRouter } from "./conversation";
import { userRouter } from "./user";

export const appRouter = router({
  conversation: conversationRouter,
  user: userRouter,
});

export type AppRouter = typeof appRouter;
