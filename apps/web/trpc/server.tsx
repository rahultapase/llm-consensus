import "server-only";
import { headers } from "next/headers";
import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { createTRPCContext } from "./init";
import { createCallerFactory } from "./init";
import { appRouter } from "./routers/_app";

const createCaller = createCallerFactory(appRouter);

export async function caller() {
  const info = {} as FetchCreateContextFnOptions["info"];

  return createCaller(
    await createTRPCContext({
      req: new Request("https://localhost", {
        headers: await headers(),
      }),
      resHeaders: new Headers(),
      info,
    })
  );
}
