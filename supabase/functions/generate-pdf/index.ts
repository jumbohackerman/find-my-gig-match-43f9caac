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
      : null;

  return `<!DOCTYPE html>
<html lang="pl"><head>
<meta charset="utf-8" />
<title>${esc(c?.full_name || "Kandydat")} — CV</title>
<style>
  @page { size: A4; margin: 16mm 18mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    color: #1a1a1a;
    background: #fff;
    line-height: 1.55;
    font-size: 11px;
  }

  /* Header */
  .header {
    padding-bottom: 16px;
    margin-bottom: 20px;
    border-bottom: 2px solid #f97316;
  }
  .header h1 { font-size: 24px; font-weight: 700; color: #111; margin-bottom: 2px; }
  .header .title { font-size: 13px; color: #f97316; font-weight: 600; margin-bottom: 6px; }
  .header .meta { display: flex; flex-wrap: wrap; gap: 12px; font-size: 10px; color: #666; }
  .header .meta span { display: flex; align-items: center; gap: 3px; }

  /* Section */
  .section { margin-bottom: 18px; }
  .section-title {
    font-size: 9px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #f97316;
    margin-bottom: 8px;
    padding-bottom: 4px;
    border-bottom: 1px solid #eee;
  }
  .section p { font-size: 11px; color: #333; }

  /* Two-col layout */
  .layout { display: grid; grid-template-columns: 1fr 200px; gap: 24px; }

  /* Experience */
  .exp-item { margin-bottom: 14px; padding-left: 12px; border-left: 2px solid #f97316; }
  .exp-item .company { font-size: 12px; font-weight: 700; color: #111; }
  .exp-item .role { font-size: 11px; color: #f97316; font-weight: 600; }
  .exp-item .period { font-size: 9px; color: #888; margin-bottom: 4px; }
  .exp-item ul { margin: 4px 0 0 14px; }
  .exp-item li { font-size: 10px; color: #444; margin-bottom: 2px; }
  .exp-item p { font-size: 10px; color: #444; margin-top: 4px; }

  /* Skills */
  .skills { display: flex; flex-wrap: wrap; gap: 4px; }
  .skill { padding: 2px 7px; border: 1px solid #ddd; border-radius: 4px; font-size: 9px; color: #333; }

  /* Languages */
  .lang { font-size: 10px; color: #333; margin-bottom: 2px; }
  .lang strong { font-weight: 600; }

  /* Salary */
  .salary { font-size: 12px; font-weight: 700; color: #f97316; }
  .salary-sub { font-size: 9px; color: #888; }
  .salary-extra { font-size: 10px; color: #555; margin-top: 4px; }

  /* Links */
  a { color: #f97316; text-decoration: none; font-size: 10px; }
  a:hover { text-decoration: underline; }
  .link-row { margin-bottom: 3px; }

  /* Footer */
  .footer {
    margin-top: 24px;
    padding-top: 12px;
    border-top: 1px solid #eee;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .footer-logo {
    width: 20px; height: 20px;
    background: #f97316;
    border-radius: 5px;
    display: flex; align-items: center; justify-content: center;
    color: #fff; font-size: 10px; font-weight: 900;
  }
  .footer-text { font-size: 9px; color: #999; }
  .footer-brand { font-weight: 700; color: #333; }
  .footer-brand span { color: #f97316; }

  @media print {
    body { padding: 0; }
    .layout { page-break-inside: auto; }
    .exp-item { page-break-inside: avoid; }
    .section { page-break-inside: avoid; }
  }
</style>
</head>
<body>
  <div class="header">
    <h1>${esc(c?.full_name || "Kandydat")}</h1>
    <div class="title">${esc(c?.title || "")}</div>
    <div class="meta">
      ${c?.location ? `<span>📍 ${esc(c.location)}</span>` : ""}
      ${c?.seniority ? `<span>🎯 ${esc(c.seniority)}</span>` : ""}
      ${c?.work_mode ? `<span>💼 ${esc(c.work_mode)}</span>` : ""}
      ${c?.availability ? `<span>⏱ ${esc(c.availability)}</span>` : ""}
    </div>
  </div>

  <div class="layout">
    <!-- MAIN -->
    <div class="main">
      ${c?.summary ? `
        <div class="section">
          <div class="section-title">Podsumowanie</div>
          <p>${esc(c.summary)}</p>
        </div>
      ` : ""}

      ${exp.length > 0 ? `
        <div class="section">
          <div class="section-title">Doświadczenie zawodowe</div>
          ${exp.map((e: any) => `
            <div class="exp-item">
              <div class="company">${esc(e?.company || e?.company_name || "")}</div>
              <div class="role">${esc(e?.role || e?.title || e?.job_title || "")}</div>
              <div class="period">${esc(e?.start_date || e?.startDate || "")} – ${esc(e?.end_date || e?.endDate || "Obecnie")}</div>
              ${(() => {
                const bullets = (e?.bullets ?? e?.description_points);
                return Array.isArray(bullets) && bullets.filter(Boolean).length > 0
                  ? `<ul>${bullets.filter(Boolean).map((b: string) => `<li>${esc(b)}</li>`).join("")}</ul>`
                  : (e?.description ? `<p>${esc(e.description)}</p>` : "");
              })()}
            </div>
          `).join("")}
        </div>
      ` : ""}
    </div>

    <!-- SIDEBAR -->
    <div class="sidebar">
      ${allSkills.length > 0 ? `
        <div class="section">
          <div class="section-title">Umiejętności</div>
          <div class="skills">${allSkills.map((s: string) => `<span class="skill">${esc(s)}</span>`).join("")}</div>
        </div>
      ` : ""}

      ${langs.length > 0 ? `
        <div class="section">
          <div class="section-title">Języki</div>
          ${langs.map((l: any) => `<div class="lang"><strong>${esc(l?.name || l)}</strong>${l?.level ? ` — ${esc(l.level)}` : ""}</div>`).join("")}
        </div>
      ` : ""}

      ${salary ? `
        <div class="section">
          <div class="section-title">Oczekiwania</div>
          <div class="salary">${salary}</div>
          <div class="salary-sub">brutto / mies.</div>
          ${c?.employment_type ? `<div class="salary-extra">${esc(c.employment_type)}</div>` : ""}
        </div>
      ` : ""}

      ${(links.portfolio_url || links.github_url || links.linkedin_url || links.website_url) ? `
        <div class="section">
          <div class="section-title">Linki</div>
          ${links.portfolio_url ? `<div class="link-row"><a href="${esc(links.portfolio_url)}">🌐 Portfolio</a></div>` : ""}
          ${links.github_url ? `<div class="link-row"><a href="${esc(links.github_url)}">💻 GitHub</a></div>` : ""}
          ${links.linkedin_url ? `<div class="link-row"><a href="${esc(links.linkedin_url)}">🔗 LinkedIn</a></div>` : ""}
          ${links.website_url ? `<div class="link-row"><a href="${esc(links.website_url)}">🌍 Strona</a></div>` : ""}
        </div>
      ` : ""}
    </div>
  </div>

  <div class="footer">
    <div class="footer-text">Wygenerowane przez:</div>
    <div class="footer-logo">J</div>
    <div>
      <div class="footer-brand">Job<span>Swipe</span>.pl</div>
      <div class="footer-text">${new Date().toLocaleDateString("pl-PL")}</div>
    </div>
  </div>
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
