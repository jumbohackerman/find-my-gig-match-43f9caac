import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

const CV_PARSE_SCHEMA = {
  type: "function" as const,
  function: {
    name: "save_parsed_cv",
    description: "Save structured CV data extracted from raw text.",
    parameters: {
      type: "object",
      properties: {
        first_name: { type: ["string", "null"] },
        last_name: { type: ["string", "null"] },
        full_name: { type: ["string", "null"] },
        headline: { type: ["string", "null"] },
        current_role: { type: ["string", "null"] },
        email: { type: ["string", "null"] },
        phone: { type: ["string", "null"] },
        city: { type: ["string", "null"] },
        country: { type: ["string", "null"] },
        date_of_birth: { type: ["string", "null"] },
        summary: { type: ["string", "null"] },
        years_of_experience: { type: ["number", "null"] },
        preferred_job_titles: { type: "array", items: { type: "string" } },
        skills: { type: "array", items: { type: "string" } },
        languages: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              level: { type: ["string", "null"] },
            },
            required: ["name"],
          },
        },
        links: {
          type: "object",
          properties: {
            linkedin_url: { type: ["string", "null"] },
            github_url: { type: ["string", "null"] },
            portfolio_url: { type: ["string", "null"] },
            other_urls: { type: "array", items: { type: "string" } },
          },
          required: ["linkedin_url", "github_url", "portfolio_url", "other_urls"],
        },
        experience: {
          type: "array",
          items: {
            type: "object",
            properties: {
              job_title: { type: ["string", "null"] },
              company: { type: ["string", "null"] },
              start_date: { type: ["string", "null"] },
              end_date: { type: ["string", "null"] },
              description: { type: ["string", "null"] },
              bullets: { type: "array", items: { type: "string" }, description: "Individual responsibilities or achievements as separate items" },
            },
            required: ["job_title", "company"],
          },
        },
        education: {
          type: "array",
          items: {
            type: "object",
            properties: {
              school: { type: ["string", "null"] },
              degree: { type: ["string", "null"] },
              field_of_study: { type: ["string", "null"] },
              start_date: { type: ["string", "null"] },
              end_date: { type: ["string", "null"] },
            },
            required: ["school"],
          },
        },
        projects: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: ["string", "null"] },
              description: { type: ["string", "null"] },
              technologies: { type: "array", items: { type: "string" } },
            },
            required: ["name"],
          },
        },
        certifications: { type: "array", items: { type: "string" } },
      },
      required: [
        "first_name", "last_name", "full_name", "headline", "current_role",
        "email", "phone", "city", "country", "date_of_birth", "summary",
        "years_of_experience", "preferred_job_titles", "skills", "languages",
        "links", "experience", "education", "projects", "certifications",
      ],
      additionalProperties: false,
    },
  },
};

const SYSTEM_PROMPT = `You are a CV/resume parser. Extract structured data from the provided CV text.

Rules:
- Extract only information explicitly present in the text.
- Do NOT guess or invent data that is not clearly stated.
- If something cannot be reliably determined, use null or empty array.
- Normalize dates to YYYY-MM or YYYY-MM-DD where possible. If unclear, use null.
- For skills, extract individual skill names (e.g. "React", "Python", not "Frontend development").
- For languages, include proficiency level if mentioned (e.g. "native", "B2", "fluent").
- Keep summaries concise and factual.
- For experience entries: if the CV lists responsibilities or achievements as bullet points, return each one as a separate string in the "bullets" array. Do NOT concatenate them into a single "description" string. Use "description" only for a brief role summary or if no bullet points exist. Each bullet should be one distinct responsibility or achievement.`;

const MODEL_NAME = "google/gemini-2.5-flash";

Deno.serve(async (req: Request) => {
  console.log("[parse-cv-ai] Incoming request, method:", req.method);

  if (req.method === "OPTIONS") {
    console.log("[parse-cv-ai] Handling OPTIONS preflight");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      console.log("[parse-cv-ai] Missing authorization header");
      return jsonResponse({ error: "Missing authorization header" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.log("[parse-cv-ai] Auth error:", authError?.message);
      return jsonResponse({ error: "Invalid or expired token" }, 401);
    }

    console.log("[parse-cv-ai] Authenticated user:", user.id);

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      console.log("[parse-cv-ai] Invalid JSON body");
      return jsonResponse({ error: "Invalid request body" }, 400);
    }

    const cv_upload_id = body.cv_upload_id as string | undefined;
    if (!cv_upload_id) {
      console.log("[parse-cv-ai] Missing cv_upload_id");
      return jsonResponse({ error: "Missing cv_upload_id" }, 400);
    }

    // Fetch parsed data record
    const { data: parsedRecord, error: fetchErr } = await supabase
      .from("cv_parsed_data")
      .select("id, raw_text, parsed_json, user_id, model_name, parse_confidence")
      .eq("cv_upload_id", cv_upload_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (fetchErr || !parsedRecord) {
      console.error("[parse-cv-ai] fetch error:", fetchErr);
      return jsonResponse({ error: "Nie znaleziono danych CV do analizy." }, 404);
    }

    if (!parsedRecord.raw_text || parsedRecord.raw_text.length < 30) {
      return jsonResponse({ error: "Tekst CV jest zbyt krótki lub pusty. Spróbuj ponownie wgrać CV." }, 400);
    }

    const existingParsedJson = parsedRecord.parsed_json;
    if (
      existingParsedJson &&
      typeof existingParsedJson === "object" &&
      Object.keys(existingParsedJson as Record<string, unknown>).length > 0
    ) {
      await supabase
        .from("cv_uploads")
        .update({ status: "parsed", error_message: null })
        .eq("id", cv_upload_id)
        .eq("user_id", user.id);

      return jsonResponse({
        success: true,
        parsed_json: existingParsedJson,
        model_name: parsedRecord.model_name ?? MODEL_NAME,
        parse_confidence: parsedRecord.parse_confidence ?? 1,
      });
    }

    // Set cv_uploads status to processing
    await supabase
      .from("cv_uploads")
      .update({ status: "ai_processing", error_message: null })
      .eq("id", cv_upload_id)
      .eq("user_id", user.id);

    // Call Open AI Gateway
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

    console.log("[parse-cv-ai] Calling AI gateway...");
    const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL_NAME,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `Parse the following CV text:\n\n${parsedRecord.raw_text}` },
        ],
        tools: [CV_PARSE_SCHEMA],
        tool_choice: { type: "function", function: { name: "save_parsed_cv" } },
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("[parse-cv-ai] AI gateway error:", aiResponse.status, errText);

      const lowerErrText = errText.toLowerCase();
      const statusMsg = aiResponse.status === 429
        ? "Zbyt wiele żądań AI. Spróbuj ponownie za chwilę."
        : aiResponse.status === 402
        ? "Brak dostępnych kredytów AI."
        : aiResponse.status === 401 || aiResponse.status === 403
        ? "Klucz OpenAI nie ma wymaganych uprawnień do wywołania modelu."
        : lowerErrText.includes("invalid model")
        ? "Ustawiony model OpenAI jest nieprawidłowy lub niedostępny dla tego klucza."
        : "Błąd usługi AI. Spróbuj ponownie.";

      await supabase
        .from("cv_uploads")
        .update({ status: "failed", error_message: statusMsg })
        .eq("id", cv_upload_id)
        .eq("user_id", user.id);

      return jsonResponse({ error: statusMsg }, aiResponse.status >= 500 ? 502 : aiResponse.status);
    }

    const aiResult = await aiResponse.json();
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall || toolCall.function?.name !== "save_parsed_cv") {
      console.error("[parse-cv-ai] Unexpected AI response shape:", JSON.stringify(aiResult).slice(0, 500));
      const msg = "AI nie zwróciło poprawnej odpowiedzi. Spróbuj ponownie.";
      await supabase
        .from("cv_uploads")
        .update({ status: "failed", error_message: msg })
        .eq("id", cv_upload_id)
        .eq("user_id", user.id);
      return jsonResponse({ error: msg }, 502);
    }

    let parsedJson: Record<string, unknown>;
    try {
      parsedJson = JSON.parse(toolCall.function.arguments);
    } catch (parseErr) {
      console.error("[parse-cv-ai] JSON parse error:", parseErr);
      const msg = "Odpowiedź AI nie jest poprawnym JSON.";
      await supabase
        .from("cv_uploads")
        .update({ status: "failed", error_message: msg })
        .eq("id", cv_upload_id)
        .eq("user_id", user.id);
      return jsonResponse({ error: msg }, 502);
    }

    // Basic confidence
    const topFields = ["full_name", "email", "city", "summary", "current_role"];
    const filledCount = topFields.filter((f) => {
      const v = parsedJson[f];
      return v !== null && v !== undefined && v !== "";
    }).length;
    const confidence = Math.round((filledCount / topFields.length) * 100) / 100;

    // Save to cv_parsed_data
    const { error: saveErr } = await supabase
      .from("cv_parsed_data")
      .update({
        parsed_json: parsedJson,
        model_name: MODEL_NAME,
        parse_confidence: confidence,
      })
      .eq("id", parsedRecord.id)
      .eq("user_id", user.id);

    if (saveErr) {
      console.error("[parse-cv-ai] save error:", saveErr);
      await supabase
        .from("cv_uploads")
        .update({ status: "failed", error_message: saveErr.message })
        .eq("id", cv_upload_id)
        .eq("user_id", user.id);
      return jsonResponse({ error: "Nie udało się zapisać wyników analizy." }, 500);
    }

    // Set final status
    await supabase
      .from("cv_uploads")
      .update({ status: "parsed", error_message: null })
      .eq("id", cv_upload_id)
      .eq("user_id", user.id);

    console.log("[parse-cv-ai] Success for user:", user.id, "confidence:", confidence);

    return jsonResponse({
      success: true,
      parsed_json: parsedJson,
      model_name: MODEL_NAME,
      parse_confidence: confidence,
    });
  } catch (error) {
    console.error("[parse-cv-ai] Unhandled error:", error);
    return jsonResponse(
      {
        error:
          error instanceof Error
            ? `Nieoczekiwany błąd analizy CV: ${error.message}`
            : "Nieoczekiwany błąd analizy CV.",
      },
      500,
    );
  }
});
