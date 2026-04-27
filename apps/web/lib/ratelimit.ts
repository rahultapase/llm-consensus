import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { env } from "@/lib/env";

const redis = new Redis({
  url: env.UPSTASH_REDIS_REST_URL,
  token: env.UPSTASH_REDIS_REST_TOKEN,
});

const councilRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "1 m"),
  prefix: "llm-consensus:ratelimit:council",
  analytics: true,
});

const readRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(60, "1 m"),
  prefix: "llm-consensus:ratelimit:read",
  analytics: true,
});

function createIdentifier(surface: "council" | "read", userId: string) {
  return `${surface}:${userId}`;
}

export const rateLimit = {
  council(userId: string) {
    return councilRatelimit.limit(createIdentifier("council", userId));
  },
  read(userId: string) {
    return readRatelimit.limit(createIdentifier("read", userId));
  },
};

export type RateLimit = typeof rateLimit;