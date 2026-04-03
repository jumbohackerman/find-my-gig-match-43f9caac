/**
 * Edge function stub: process-cv
 *
 * Future integration: AI-powered CV parsing via Lovable AI models.
 * Extracts structured candidate data (title, skills, experience) from uploaded PDFs.
 *
 * Flow:
 *   1. Client uploads CV to storage bucket "cvs"
 *   2. Client calls this function with the storage path
 *   3. Function downloads PDF, sends to AI model for extraction
 *   4. Returns structured ParsedCV data
 *   5. Client updates candidate profile with parsed data
 *
 * Required secrets: OPENAI_API_KEY (configured in backend secrets)
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

  // Validate auth
  const authHeader = req.headers.get("authorization");
  if (!authHeader) {
    return new Response(
      JSON.stringify({ error: "Missing authorization header" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  try {
    // Verify the user token
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

    const { storagePath } = await req.json();

    if (!storagePath) {
      return new Response(
        JSON.stringify({ error: "Missing required field: storagePath" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Verify the user owns this CV path (path must start with their user ID)
    if (!storagePath.startsWith(`${user.id}/`)) {
      return new Response(
        JSON.stringify({ error: "Access denied: you can only process your own CVs" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // TODO: Implement CV parsing pipeline
    // 1. Download file from Supabase Storage
    // 2. Extract text (pdf-parse or similar)
    // 3. Send to Lovable AI for structured extraction
    // 4. Return ParsedCV object

    console.log("[process-cv] Stub called:", { storagePath, userId: user.id });

    return new Response(
      JSON.stringify({
        success: true,
        message: "CV processing stub — not implemented yet",
        parsed: null,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("[process-cv] Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
