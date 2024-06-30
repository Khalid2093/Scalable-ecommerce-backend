import { TryCatch } from "./error.js";
import { redis } from "../app.js";
import { rateLimiterProps } from "../types/types.js";

export const rateLimiter = ({
  limit = 20,
  timer = 60,
  key,
}: rateLimiterProps) =>
  TryCatch(async (req, res, next) => {
    const clientIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    const fullKey = `${clientIp}:${key}:request_count`;
    const requestCount = await redis.incr(fullKey);

    if (requestCount === 1) {
      await redis.expire(fullKey, timer);
    }
    const remainingTime = await redis.ttl(fullKey);

    if (requestCount > limit) {
      return res.status(429).json({
        success: false,
        message: `You have exceeded the ${limit} requests in ${remainingTime} seconds. Please try again later.`,
      });
    }

    next();
  });
