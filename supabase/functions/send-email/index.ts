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

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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

    console.log("[send-email] Stub called:", { to, subject });

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
