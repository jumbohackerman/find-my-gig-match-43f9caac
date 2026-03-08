/**
 * Edge function stub: validate-status-transition
 *
 * Server-side validation of application status transitions.
 * Prevents invalid jumps (e.g. applied → hired) and enforces business rules.
 *
 * Future: called as a webhook from a Supabase trigger on applications.status UPDATE,
 * or invoked by the client before updating status.
 *
 * Valid transitions:
 *   applied      → viewed | not_selected | position_closed
 *   viewed       → shortlisted | not_selected | position_closed
 *   shortlisted  → interview | not_selected | position_closed
 *   interview    → hired | not_selected | position_closed
 *   hired        → (terminal)
 *   not_selected → (terminal)
 *   position_closed → (terminal)
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const VALID_TRANSITIONS: Record<string, string[]> = {
  applied: ["viewed", "not_selected", "position_closed"],
  viewed: ["shortlisted", "not_selected", "position_closed"],
  shortlisted: ["interview", "not_selected", "position_closed"],
  interview: ["hired", "not_selected", "position_closed"],
  hired: [],
  not_selected: [],
  position_closed: [],
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Validate auth — only authenticated users can validate transitions
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

    const { currentStatus, newStatus } = await req.json();

    if (!currentStatus || !newStatus) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: currentStatus, newStatus" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const allowed = VALID_TRANSITIONS[currentStatus];
    if (!allowed) {
      return new Response(
        JSON.stringify({ valid: false, reason: `Unknown status: ${currentStatus}` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const valid = allowed.includes(newStatus);

    return new Response(
      JSON.stringify({
        valid,
        reason: valid
          ? `Transition ${currentStatus} → ${newStatus} is allowed`
          : `Invalid transition: ${currentStatus} → ${newStatus}. Allowed: ${allowed.join(", ")}`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("[validate-status-transition] Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
