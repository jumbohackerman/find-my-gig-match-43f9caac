import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") ?? "https://www.jobswipe.pl",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DEMO_USER_IDS = [
  "aaaaaaaa-0000-0000-0000-000000000001",
  "aaaaaaaa-0000-0000-0000-000000000002",
];

const DEMO_JOB_IDS = [
  "bbbbbbbb-0000-0000-0000-000000000001",
  "bbbbbbbb-0000-0000-0000-000000000002",
  "bbbbbbbb-0000-0000-0000-000000000003",
  "bbbbbbbb-0000-0000-0000-000000000004",
  "bbbbbbbb-0000-0000-0000-000000000005",
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  // ── Security gate: require admin secret ──
  const expectedSecret = Deno.env.get("ADMIN_SECRET");
  const providedSecret =
    req.headers.get("x-admin-secret") ?? new URL(req.url).searchParams.get("secret");
  if (!expectedSecret || providedSecret !== expectedSecret) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const results: string[] = [];

  try {
    // Delete in dependency order
    for (const table of ["notifications", "messages", "swipe_events", "saved_jobs", "applications"]) {
      const ids = DEMO_USER_IDS;
      const col = table === "applications" ? "candidate_id" : "user_id";
      // For messages, delete by application_id referencing demo apps
      if (table === "messages") {
        await admin.from("messages").delete().like("id", "dddddddd%");
      } else {
        await admin.from(table).delete().in(col, ids);
      }
      results.push(`🗑️ ${table} cleared`);
    }

    // Delete jobs owned by demo employer
    await admin.from("jobs").delete().in("id", DEMO_JOB_IDS);
    results.push("🗑️ jobs cleared");

    // Delete candidates + profiles
    for (const table of ["candidates", "profiles"]) {
      await admin.from(table).delete().in("user_id", DEMO_USER_IDS);
      results.push(`🗑️ ${table} cleared`);
    }

    // Delete auth users
    for (const uid of DEMO_USER_IDS) {
      await admin.auth.admin.deleteUser(uid).catch(() => {});
    }
    results.push("🗑️ auth users deleted");

    return new Response(JSON.stringify({ ok: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: String(err), results }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
