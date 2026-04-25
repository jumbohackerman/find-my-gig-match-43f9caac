// Block 5C — AI Shortlist edge function (with MOCK AI for now)
// Replace MOCK with real AI once AI_API_KEY is configured.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") ?? "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// AI PROMPTS — edit these after migration to customize shortlisting behavior
const SHORTLIST_SYSTEM_PROMPT = `You are a professional recruiter AI assistant for JobSwipe.
Your task is to analyze candidate profiles against a job offer and select the top 5 candidates.

CRITICAL RULES:
- Evaluate ONLY professional criteria: skills, experience, seniority level, salary expectations, work preferences
- NEVER consider: name, gender, age, nationality, ethnicity, or any personal characteristics
- Be objective and merit-based
- If all candidates are weak, still return the top 5 available

Return ONLY valid JSON, no markdown, no explanation outside JSON.`;

const buildShortlistPrompt = (job: object, candidates: object[]) => `
Analyze these candidates for the following job position and select the TOP 5 best matches.

JOB OFFER:
${JSON.stringify(job, null, 2)}

CANDIDATES (${candidates.length} total):
${JSON.stringify(candidates, null, 2)}

Return JSON in this exact format:
{
  "top5": [
    {
      "candidate_id": "uuid",
      "rank": 1,
      "shortlist_score": 87.5,
      "justification": "2-3 sentences explaining why this candidate is selected, based on professional criteria only"
    }
  ],
  "rejected_feedbacks": [
    {
      "candidate_id": "uuid",
      "feedback_points": [
        "Specific professional gap or mismatch point 1",
        "Specific professional gap or mismatch point 2"
      ]
    }
  ]
}`;

interface AICandidate {
  candidate_id: string;
  full_name?: string;
  job_title?: string;
  [k: string]: unknown;
}

interface AIResult {
  top5: Array<{
    candidate_id: string;
    rank: number;
    shortlist_score: number;
    justification: string;
  }>;
  rejected_feedbacks: Array<{
    candidate_id: string;
    feedback_points: string[];
  }>;
}

/**
 * MOCK AI — picks first 5 candidates alphabetically by full_name (fallback to candidate_id).
 * Returns identical JSON structure as real AI would.
 */
function mockAIShortlist(candidates: AICandidate[]): AIResult {
  // Shuffle candidates pseudo-randomly instead of sorting alphabetically
  const shuffled = [...candidates].sort(() => Math.random() - 0.5);

  const scores = [91.5, 85.0, 79.5, 74.0, 68.5];
  const justifications = [
    "Profil najlepiej odpowiada wymaganiom technicznym oferty. Doświadczenie i umiejętności wysoce kompatybilne z opisem stanowiska.",
    "Silne dopasowanie kompetencji zawodowych. Doświadczenie w podobnym sektorze i na zbliżonym poziomie seniority.",
    "Dobry zakres umiejętności technicznych. Doświadczenie częściowo pokrywa się z wymaganiami — solidny kandydat z potencjałem.",
    "Kompetencje bazowe zgodne z ofertą. Niektóre wymagania wymagają dodatkowej weryfikacji podczas rozmowy.",
    "Profil spełnia minimalne wymagania oferty. Kandydat może wnieść wartość dodaną dzięki unikalnym doświadczeniom.",
  ];

  const top5 = shuffled.slice(0, 5).map((c, i) => ({
    candidate_id: c.candidate_id,
    rank: i + 1,
    shortlist_score: scores[i],
    justification: justifications[i],
  }));

  const rejectionReasons = [
    "Poziom doświadczenia poniżej wymagań oferty. Sugerujemy uzupełnienie kompetencji w kluczowych technologiach.",
    "Oczekiwania finansowe znacząco powyżej widełek oferowanych na tym stanowisku.",
    "Profil skoncentrowany na innym obszarze specjalizacji niż wymagany w ofercie.",
    "Brak wymaganego doświadczenia komercyjnego w kluczowych technologiach.",
  ];

  const rejected_feedbacks = shuffled.slice(5).map((c) => ({
    candidate_id: c.candidate_id,
    feedback_points: [
      rejectionReasons[Math.floor(Math.random() * rejectionReasons.length)],
      "Zachęcamy do śledzenia nowych ofert — Twoje kompetencje mogą pasować do innych stanowisk.",
    ],
  }));

  return { top5, rejected_feedbacks };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { job_id } = await req.json();
    if (!job_id) throw new Error("job_id is required");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const supabase = createClient(supabaseUrl, serviceKey);

    // Verify caller
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Unauthorized");
    const { data: { user } } = await createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    }).auth.getUser();
    if (!user) throw new Error("Unauthorized");

    // Job ownership
    const { data: job } = await supabase
      .from("jobs")
      .select("*")
      .eq("id", job_id)
      .eq("employer_id", user.id)
      .single();
    if (!job) throw new Error("Job not found or unauthorized");

    // No existing shortlist
    const { data: existing } = await supabase
      .from("shortlists")
      .select("id")
      .eq("job_id", job_id)
      .maybeSingle();
    if (existing) throw new Error("Shortlist already exists for this job");

    // Min 10 candidates
    const { data: applications, error: appsErr } = await supabase
      .from("applications")
      .select("id, candidate_id")
      .eq("job_id", job_id)
      .eq("status", "applied");
    if (appsErr) throw appsErr;
    if (!applications || applications.length < 10) {
      throw new Error(`Need at least 10 candidates, currently have ${applications?.length ?? 0}`);
    }

    // Fetch candidate professional data
    const candidateIds = applications.map((a) => a.candidate_id);
    const { data: candidates } = await supabase
      .from("candidates")
      .select("user_id, full_name, title, location, summary, skills, experience_entries, languages, salary_min, salary_max, seniority, years_of_experience, work_mode, employment_type, primary_industry, links")
      .in("user_id", candidateIds);

    const candidatesForAI: AICandidate[] = (candidates || []).map((c) => ({
      candidate_id: c.user_id,
      full_name: c.full_name,
      job_title: c.title,
      location: c.location,
      summary: c.summary,
      skills: c.skills,
      experience: c.experience_entries,
      languages: c.languages,
      salary_min: c.salary_min,
      salary_max: c.salary_max,
      level: c.seniority,
      years_experience: c.years_of_experience,
      work_mode: c.work_mode,
      employment_type: c.employment_type,
      industry: c.primary_industry,
    }));

    const aiModel = Deno.env.get("AI_MODEL") ?? "claude-opus-4-5";

    // Create shortlist record (status=processing)
    const { data: shortlist, error: shortlistErr } = await supabase
      .from("shortlists")
      .insert({
        job_id,
        employer_id: user.id,
        status: "processing",
        ai_model_used: aiModel,
      })
      .select()
      .single();
    if (shortlistErr || !shortlist) throw shortlistErr ?? new Error("Failed to create shortlist");

    // ========== AI CALL ==========
    // TODO: uncomment real AI call when AI_API_KEY is configured
    /*
    const aiResponse = await fetch(
      Deno.env.get("AI_API_URL") ?? "https://api.anthropic.com/v1/messages",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": Deno.env.get("AI_API_KEY")!,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: aiModel,
          max_tokens: 4096,
          system: SHORTLIST_SYSTEM_PROMPT,
          messages: [{ role: "user", content: buildShortlistPrompt(job, candidatesForAI) }],
        }),
      },
    );
    const aiData = await aiResponse.json();
    const result: AIResult = JSON.parse(aiData.content[0].text);
    */
    // MOCK — first 5 alphabetically. Uses same JSON shape as real AI.
    void SHORTLIST_SYSTEM_PROMPT;
    void buildShortlistPrompt;
    const result: AIResult = mockAIShortlist(candidatesForAI);
    // =============================

    // Save snapshots for top 5
    for (const sel of result.top5) {
      const c = candidates?.find((x) => x.user_id === sel.candidate_id);
      await supabase.from("ai_shortlist_snapshots").insert({
        shortlist_id: shortlist.id,
        ai_shortlist_id: shortlist.id, // legacy NOT NULL column kept in sync
        candidate_id: sel.candidate_id,
        job_id,
        rank: sel.rank,
        shortlist_score: sel.shortlist_score,
        ai_justification: sel.justification,
        snapshot_full_name: c?.full_name,
        snapshot_job_title: c?.title,
        snapshot_location: c?.location,
        snapshot_summary: c?.summary,
        snapshot_skills: c?.skills,
        snapshot_experience: c?.experience_entries,
        snapshot_languages: c?.languages,
        snapshot_salary_min: c?.salary_min,
        snapshot_salary_max: c?.salary_max,
        snapshot_level: c?.seniority,
        snapshot_links: c?.links,
      });

      await supabase
        .from("applications")
        .update({ status: "shortlisted" })
        .eq("job_id", job_id)
        .eq("candidate_id", sel.candidate_id);
    }

    // Reject the rest
    const shortlistedIds = new Set(result.top5.map((s) => s.candidate_id));
    const rejectedIds = candidateIds.filter((id) => !shortlistedIds.has(id));
    if (rejectedIds.length > 0) {
      await supabase
        .from("applications")
        .update({ status: "not_selected" })
        .eq("job_id", job_id)
        .in("candidate_id", rejectedIds);
    }

    // Complete shortlist
    await supabase
      .from("shortlists")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        total_candidates_analyzed: applications.length,
      })
      .eq("id", shortlist.id);

    // Fire-and-forget email notifications
    supabase.functions
      .invoke("send-email", {
        body: {
          type: "shortlist_complete",
          job_id,
          shortlist_id: shortlist.id,
          top5_ids: [...shortlistedIds],
          rejected_feedbacks: result.rejected_feedbacks,
          job_title: job.title,
          company_name: job.company,
        },
      })
      .catch((e) => console.error("[run-shortlist] email invoke error:", e));

    return new Response(
      JSON.stringify({ success: true, shortlist_id: shortlist.id, mock: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("[run-shortlist] error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
