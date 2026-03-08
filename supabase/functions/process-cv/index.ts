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
 * Required secrets: none (uses Lovable AI — LOVABLE_API_KEY already configured)
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
    const { storagePath } = await req.json();

    if (!storagePath) {
      return new Response(
        JSON.stringify({ error: "Missing required field: storagePath" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // TODO: Implement CV parsing pipeline
    // 1. Download file from Supabase Storage
    // 2. Extract text (pdf-parse or similar)
    // 3. Send to Lovable AI for structured extraction
    // 4. Return ParsedCV object

    console.log("[process-cv] Stub called:", { storagePath });

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
