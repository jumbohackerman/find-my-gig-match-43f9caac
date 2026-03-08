/**
 * Edge function stub: send-email
 *
 * Future integration: Resend API for transactional emails
 * (application confirmations, status change notifications, interview invites).
 *
 * Required secrets (not yet configured):
 *   - RESEND_API_KEY
 *
 * Usage from client:
 *   supabase.functions.invoke("send-email", { body: { to, subject, html } })
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Validate auth — only authenticated users can trigger emails
  const authHeader = req.headers.get("authorization");
  if (!authHeader) {
    return new Response(
      JSON.stringify({ error: "Missing authorization header" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { to, subject, html } = await req.json();

    if (!to || !subject || !html) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: to, subject, html" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // TODO: Replace with Resend API call once RESEND_API_KEY is configured
    // const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    // const res = await fetch("https://api.resend.com/emails", {
    //   method: "POST",
    //   headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    //   body: JSON.stringify({ from: "noreply@findmygig.app", to, subject, html }),
    // });

    console.log("[send-email] Stub called:", { to, subject, userId: user.id });

    return new Response(
      JSON.stringify({ success: true, message: "Email stub — not sent yet" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("[send-email] Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
