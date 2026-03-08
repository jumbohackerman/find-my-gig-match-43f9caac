/**
 * Edge function stub: rate-limiter
 *
 * Middleware-style rate limiter for sensitive endpoints.
 * Future: use Supabase KV / Redis or in-memory Map with TTL.
 *
 * Intended usage:
 *   - Limit job applications per candidate per hour
 *   - Limit message sends per user per minute
 *   - Limit CV uploads per user per day
 *
 * Can be called as a pre-check from other edge functions or directly from client.
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// In-memory rate limit store (resets on cold start — acceptable for edge functions)
const store = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number,
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    const resetAt = now + windowMs;
    store.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: maxRequests - 1, resetAt };
  }

  if (entry.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return { allowed: true, remaining: maxRequests - entry.count, resetAt: entry.resetAt };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { key, maxRequests = 10, windowMs = 60_000 } = await req.json();

    if (!key) {
      return new Response(
        JSON.stringify({ error: "Missing required field: key" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const result = checkRateLimit(key, maxRequests, windowMs);

    return new Response(JSON.stringify(result), {
      status: result.allowed ? 200 : 429,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "X-RateLimit-Remaining": String(result.remaining),
        "X-RateLimit-Reset": String(result.resetAt),
      },
    });
  } catch (error) {
    console.error("[rate-limiter] Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
