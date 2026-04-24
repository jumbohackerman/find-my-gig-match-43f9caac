/**
 * Block 8 — generate-pdf
 * Generuje czystą stronę HTML profilu kandydata (white/black, print-ready),
 * którą frontend otwiera w nowym oknie i wywołuje window.print().
 *
 * Body: { type: "candidate_profile", id: <candidate user_id> }
 * Returns: { html: string }
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const esc = (s: unknown) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

function renderHtml(c: any) {
  const skills = c?.skills || {};
  const allSkills = [
    ...(skills.advanced || []),
    ...(skills.intermediate || []),
    ...(skills.beginner || []),
  ];
  const exp = Array.isArray(c?.experience_entries) ? c.experience_entries : [];
  const langs = Array.isArray(c?.languages) ? c.languages : [];
  const links = c?.links || {};
  const salary =
    c?.salary_min || c?.salary_max
      ? `${(c?.salary_min || 0).toLocaleString("pl-PL")} – ${(c?.salary_max || 0).toLocaleString("pl-PL")} ${esc(c?.salary_currency || "PLN")}`
      : "—";

  return `<!DOCTYPE html>
<html lang="pl"><head>
<meta charset="utf-8" />
<title>${esc(c?.full_name || "Kandydat")} — CV</title>
<style>
  @page { margin: 18mm; }
  * { box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #111; background: #fff; line-height: 1.5; margin: 0; padding: 24px; max-width: 820px; }
  h1 { font-size: 28px; margin: 0 0 4px; }
  h2 { font-size: 16px; margin: 24px 0 8px; padding-bottom: 4px; border-bottom: 1px solid #ddd; text-transform: uppercase; letter-spacing: 0.04em; color: #333; }
  h3 { font-size: 14px; margin: 12px 0 2px; }
  p, li { font-size: 12px; }
  .meta { color: #555; font-size: 12px; margin-bottom: 16px; }
  .meta span { margin-right: 12px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 16px; font-size: 12px; }
  .skills { display: flex; flex-wrap: wrap; gap: 6px; }
  .skill { padding: 3px 8px; border: 1px solid #ccc; border-radius: 4px; font-size: 11px; }
  .exp { margin-bottom: 12px; }
  .exp .role { font-weight: 600; }
  .exp .company { color: #555; font-size: 12px; }
  .exp .period { color: #777; font-size: 11px; }
  .exp ul { margin: 4px 0 0 16px; padding: 0; }
  a { color: #0070f3; text-decoration: none; }
  .footer { margin-top: 32px; padding-top: 8px; border-top: 1px solid #eee; font-size: 10px; color: #999; text-align: center; }
  @media print { body { padding: 0; } a { color: #111; } }
</style>
</head>
<body>
  <h1>${esc(c?.full_name || "Kandydat")}</h1>
  <div class="meta">
    <span><strong>${esc(c?.title || "")}</strong></span>
    ${c?.location ? `<span>📍 ${esc(c.location)}</span>` : ""}
    ${c?.years_of_experience ? `<span>${esc(c.years_of_experience)} lat doświadczenia</span>` : ""}
    ${c?.seniority ? `<span>${esc(c.seniority)}</span>` : ""}
  </div>

  ${c?.summary ? `<h2>Podsumowanie</h2><p>${esc(c.summary)}</p>` : ""}

  <h2>Oczekiwania</h2>
  <div class="grid">
    <div><strong>Wynagrodzenie:</strong> ${salary}</div>
    <div><strong>Tryb pracy:</strong> ${esc(c?.work_mode || "—")}</div>
    <div><strong>Forma zatrudnienia:</strong> ${esc(c?.employment_type || "—")}</div>
    <div><strong>Dostępność:</strong> ${esc(c?.availability || "—")}</div>
    ${c?.primary_industry ? `<div><strong>Branża:</strong> ${esc(c.primary_industry)}</div>` : ""}
    <div><strong>Relokacja:</strong> ${c?.relocation_openness ? "Tak" : "Nie"}</div>
  </div>

  ${allSkills.length > 0 ? `<h2>Umiejętności</h2>
    <div class="skills">${allSkills.map((s: string) => `<span class="skill">${esc(s)}</span>`).join("")}</div>` : ""}

  ${exp.length > 0 ? `<h2>Doświadczenie</h2>${exp.map((e: any) => `
    <div class="exp">
      <div class="role">${esc(e?.role || e?.title || "")}</div>
      <div class="company">${esc(e?.company || "")}${e?.location ? " · " + esc(e.location) : ""}</div>
      <div class="period">${esc(e?.start_date || e?.startDate || "")} – ${esc(e?.end_date || e?.endDate || "obecnie")}</div>
      ${Array.isArray(e?.bullets) && e.bullets.length > 0 ? `<ul>${e.bullets.map((b: string) => `<li>${esc(b)}</li>`).join("")}</ul>` : (e?.description ? `<p>${esc(e.description)}</p>` : "")}
    </div>`).join("")}` : ""}

  ${langs.length > 0 ? `<h2>Języki</h2>
    <div class="skills">${langs.map((l: any) => `<span class="skill">${esc(l?.name || l)} ${l?.level ? "· " + esc(l.level) : ""}</span>`).join("")}</div>` : ""}

  ${(links.portfolio_url || links.github_url || links.linkedin_url || links.website_url) ? `<h2>Linki</h2>
    <p>
      ${links.portfolio_url ? `<a href="${esc(links.portfolio_url)}">Portfolio</a> &nbsp;` : ""}
      ${links.github_url ? `<a href="${esc(links.github_url)}">GitHub</a> &nbsp;` : ""}
      ${links.linkedin_url ? `<a href="${esc(links.linkedin_url)}">LinkedIn</a> &nbsp;` : ""}
      ${links.website_url ? `<a href="${esc(links.website_url)}">Strona</a>` : ""}
    </p>` : ""}

  <div class="footer">Wygenerowano przez JobSwipe.pl · ${new Date().toLocaleDateString("pl-PL")}</div>
</body></html>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing Authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const { type, id } = body || {};
    if (type !== "candidate_profile" || !id || typeof id !== "string") {
      return new Response(JSON.stringify({ error: "Invalid params" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Verify caller
    const { data: userData } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    const callerId = userData?.user?.id;
    if (!callerId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Authorization: caller is candidate themselves OR employer with shortlisted/applied app
    let allowed = callerId === id;
    if (!allowed) {
      const { data: apps } = await supabase
        .from("applications")
        .select("id, job_id, jobs!inner(employer_id)")
        .eq("candidate_id", id);
      allowed = !!(apps || []).find((a: any) => a?.jobs?.employer_id === callerId);
    }
    if (!allowed) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: candidate, error } = await supabase
      .from("candidates")
      .select("*")
      .eq("user_id", id)
      .maybeSingle();

    if (error || !candidate) {
      return new Response(JSON.stringify({ error: "Candidate not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ html: renderHtml(candidate) }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
