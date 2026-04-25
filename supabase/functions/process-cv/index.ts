/**
 * @deprecated Use parse-cv-ai instead. This edge function returns MOCK data only.
 * It will be removed after migration to production hosting.
 * The production CV parser is: supabase/functions/parse-cv-ai/index.ts
 */
/**
 * Edge function: process-cv
 *
 * AI-powered CV → structured profile data extraction.
 *
 * Block 11 (AI #1) — currently returns a MOCK response.
 * The real AI fetch is wired but commented out until AI_API_KEY is configured.
 *
 * Required env (set via `supabase secrets set ...`):
 *   - AI_API_KEY   (e.g. sk-ant-..., sk-...)
 *   - AI_MODEL     (e.g. claude-opus-4-5, gpt-4o)
 *   - AI_API_URL   (e.g. https://api.anthropic.com/v1/messages)
 *   - ALLOWED_ORIGIN  (CORS — frontend origin)
 *
 * Request body: { cvText: string }
 * Response: { success: true, parsed: ParsedCv } | { error: string }
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ─── CORS ────────────────────────────────────────────────────────────────────
const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") ?? "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ─── AI prompts (editable post-deployment) ───────────────────────────────────

const CV_EXTRACTION_SYSTEM_PROMPT = `You are a CV data extraction assistant.
Extract structured professional data from the provided CV text.
RULES:
- Extract ONLY data explicitly present in the CV
- Do NOT infer, guess, or add missing data
- Return empty strings/arrays for missing fields
- Split work experience into separate entries
- Split responsibilities into separate bullet points
- Return ONLY valid JSON, no markdown, no explanation`;

const buildCvPrompt = (cvText: string) => `
Extract professional data from this CV and return JSON in this exact format:
{
  "full_name": "",
  "job_title": "",
  "location": "",
  "summary": "",
  "salary_min": null,
  "salary_max": null,
  "level": "",
  "skills": { "advanced": [], "intermediate": [], "basic": [] },
  "experience": [
    { "title": "", "company": "", "start_date": "", "end_date": "", "is_current": false, "responsibilities": [] }
  ],
  "education": [
    { "degree": "", "school": "", "field": "", "start_date": "", "end_date": "" }
  ],
  "languages": [{ "name": "", "level": "" }],
  "links": { "linkedin": "", "github": "", "portfolio": "", "website": "" }
}
CV TEXT:
${cvText}`;

// ─── Handler ─────────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } = await supabase.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const userId = claimsData.claims.sub;

    const body = await req.json().catch(() => null);
    const cvText: unknown = body?.cvText;
    if (typeof cvText !== "string" || cvText.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Missing required field: cvText (non-empty string)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (cvText.length > 200_000) {
      return new Response(
        JSON.stringify({ error: "cvText too large (max 200000 chars)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    console.log("[process-cv] invoked", { userId, cvTextLength: cvText.length });

    // ─── Real AI call (commented out until AI_API_KEY is configured) ─────────
    // TODO: uncomment real AI call when AI_API_KEY is configured
    // const aiResponse = await fetch(
    //   Deno.env.get("AI_API_URL") ?? "https://api.anthropic.com/v1/messages",
    //   {
    //     method: "POST",
    //     headers: {
    //       "Content-Type": "application/json",
    //       "x-api-key": Deno.env.get("AI_API_KEY")!,
    //       "anthropic-version": "2023-06-01",
    //     },
    //     body: JSON.stringify({
    //       model: Deno.env.get("AI_MODEL") ?? "claude-opus-4-5",
    //       max_tokens: 2048,
    //       system: CV_EXTRACTION_SYSTEM_PROMPT,
    //       messages: [{ role: "user", content: buildCvPrompt(cvText) }],
    //     }),
    //   },
    // );
    // const aiData = await aiResponse.json();
    // const result = JSON.parse(aiData.content[0].text);

    // MOCK response — remove when AI_API_KEY is configured
    // Reference the prompt builder so the linter does not flag it as unused.
    void buildCvPrompt;
    void CV_EXTRACTION_SYSTEM_PROMPT;
    const result = {
      full_name: "Jan Kowalski",
      job_title: "Frontend Developer",
      location: "Warszawa",
      summary: "Doświadczony developer z 4-letnim stażem w budowaniu aplikacji webowych.",
      salary_min: 12000,
      salary_max: 18000,
      level: "Mid",
      skills: {
        advanced: ["React", "TypeScript"],
        intermediate: ["Node.js", "PostgreSQL"],
        basic: ["Docker"],
      },
      experience: [
        {
          title: "Frontend Developer",
          company: "Example Sp. z o.o.",
          start_date: "2021-03",
          end_date: "",
          is_current: true,
          responsibilities: [
            "Budowanie interfejsów w React",
            "Code review i mentoring juniorów",
          ],
        },
      ],
      education: [
        {
          degree: "Inżynier",
          school: "Politechnika Warszawska",
          field: "Informatyka",
          start_date: "2017-10",
          end_date: "2021-06",
        },
      ],
      languages: [{ name: "Angielski", level: "B2" }],
      links: { linkedin: "", github: "", portfolio: "", website: "" },
    };

    return new Response(
      JSON.stringify({ success: true, parsed: result }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("[process-cv] error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
