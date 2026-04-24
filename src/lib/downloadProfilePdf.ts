/**
 * Client-side CV PDF generation.
 *
 * Strategy: render a hidden #cv-print-area into the document body, inject
 * print-only CSS, then call window.print(). The browser's "Save as PDF"
 * destination produces a pixel-perfect, premium two-column CV.
 *
 * No new browser windows. No edge function. No backend roundtrip.
 */
import { getProvider } from "@/providers/registry";
import { toast } from "sonner";
import type { Candidate } from "@/domain/models";

const PRINT_AREA_ID = "cv-print-area";
const PRINT_STYLE_ID = "cv-print-styles";
const FONTS_LINK_ID = "cv-print-fonts";

const esc = (s: unknown) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

function getInitials(name: string): string {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatDateRange(start: string, end: string, isCurrent: boolean): string {
  const s = (start || "").trim();
  const e = isCurrent ? "obecnie" : (end || "").trim() || "—";
  if (!s && !e) return "";
  return `${s || "—"} – ${e}`;
}

function formatSalary(min: number, max: number, currency: string): string | null {
  if (!min && !max) return null;
  const f = (n: number) => n.toLocaleString("pl-PL");
  const cur = currency || "PLN";
  if (min && max) return `${f(min)} – ${f(max)} ${cur}`;
  return `${f(min || max)} ${cur}`;
}

function ensureFonts() {
  if (document.getElementById(FONTS_LINK_ID)) return;
  const link = document.createElement("link");
  link.id = FONTS_LINK_ID;
  link.rel = "stylesheet";
  link.href =
    "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@500;600;700;800&display=swap";
  document.head.appendChild(link);
}

function ensurePrintStyles() {
  if (document.getElementById(PRINT_STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = PRINT_STYLE_ID;
  style.textContent = `
    /* Hide the print area on screen — only used for printing */
    @media screen {
      #${PRINT_AREA_ID} { display: none !important; }
    }

    /* When printing: hide everything else, show only the CV */
    @media print {
      html, body {
        margin: 0 !important;
        padding: 0 !important;
        background: #ffffff !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      body > *:not(#${PRINT_AREA_ID}) {
        display: none !important;
      }
      #${PRINT_AREA_ID} {
        display: flex !important;
        position: static !important;
      }
      @page {
        size: A4;
        margin: 0;
      }
    }

    /* CV layout — applies in both screen (when forced visible) and print */
    #${PRINT_AREA_ID} {
      width: 210mm;
      min-height: 297mm;
      margin: 0 auto;
      background: #ffffff;
      color: #1a1a2e;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 10.5pt;
      line-height: 1.5;
      display: flex;
      flex-direction: row;
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    #${PRINT_AREA_ID} * { box-sizing: border-box; }

    /* ── Sidebar (left, dark) ───────────────────────────── */
    #${PRINT_AREA_ID} .cv-sidebar {
      width: 32%;
      background: #1a1a2e;
      color: #ffffff;
      padding: 28px 22px;
      display: flex;
      flex-direction: column;
      gap: 22px;
    }
    #${PRINT_AREA_ID} .cv-avatar {
      width: 110px;
      height: 110px;
      border-radius: 50%;
      background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'Outfit', sans-serif;
      font-weight: 700;
      font-size: 38pt;
      letter-spacing: 1px;
      margin: 0 auto 4px;
      box-shadow: 0 8px 22px rgba(249, 115, 22, 0.35);
    }
    #${PRINT_AREA_ID} .cv-side-name {
      font-family: 'Outfit', sans-serif;
      font-weight: 700;
      font-size: 18pt;
      line-height: 1.15;
      color: #ffffff;
      text-align: center;
      margin: 0;
    }
    #${PRINT_AREA_ID} .cv-side-title {
      color: #f97316;
      font-weight: 500;
      font-size: 11pt;
      text-align: center;
      margin: 4px 0 0;
    }
    #${PRINT_AREA_ID} .cv-divider {
      height: 2px;
      width: 48px;
      background: linear-gradient(90deg, #f97316, #ea580c);
      border-radius: 2px;
      margin: 4px auto;
    }
    #${PRINT_AREA_ID} .cv-side-section {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    #${PRINT_AREA_ID} .cv-side-heading {
      font-family: 'Outfit', sans-serif;
      font-weight: 700;
      font-size: 9pt;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: #f97316;
      margin: 0;
      padding-bottom: 6px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.12);
    }
    #${PRINT_AREA_ID} .cv-contact-item {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      color: #e5e7eb;
      font-size: 9.5pt;
      word-break: break-word;
      line-height: 1.4;
    }
    #${PRINT_AREA_ID} .cv-icon {
      flex-shrink: 0;
      width: 14px;
      height: 14px;
      color: #f97316;
      margin-top: 2px;
    }
    #${PRINT_AREA_ID} .cv-pills {
      display: flex;
      flex-wrap: wrap;
      gap: 5px;
    }
    #${PRINT_AREA_ID} .cv-skill-group { margin-bottom: 10px; }
    #${PRINT_AREA_ID} .cv-skill-group:last-child { margin-bottom: 0; }
    #${PRINT_AREA_ID} .cv-skill-label {
      font-size: 8pt;
      color: #cbd5e1;
      margin: 0 0 5px;
      font-weight: 500;
      letter-spacing: 0.5px;
    }
    #${PRINT_AREA_ID} .cv-pill {
      display: inline-block;
      padding: 3px 9px;
      border-radius: 999px;
      font-size: 8.5pt;
      font-weight: 500;
      line-height: 1.3;
    }
    #${PRINT_AREA_ID} .cv-pill-advanced {
      background: #f97316;
      color: #ffffff;
    }
    #${PRINT_AREA_ID} .cv-pill-intermediate {
      background: transparent;
      color: #f97316;
      border: 1px solid #f97316;
    }
    #${PRINT_AREA_ID} .cv-pill-basic {
      background: rgba(255, 255, 255, 0.08);
      color: #cbd5e1;
      border: 1px solid rgba(255, 255, 255, 0.15);
    }
    #${PRINT_AREA_ID} .cv-lang-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 8px;
      color: #e5e7eb;
      font-size: 9.5pt;
      padding: 3px 0;
    }
    #${PRINT_AREA_ID} .cv-lang-level {
      background: rgba(249, 115, 22, 0.18);
      color: #f97316;
      border: 1px solid rgba(249, 115, 22, 0.4);
      border-radius: 4px;
      padding: 1px 7px;
      font-size: 8pt;
      font-weight: 600;
      letter-spacing: 0.5px;
    }
    #${PRINT_AREA_ID} .cv-expect-row {
      color: #e5e7eb;
      font-size: 9.5pt;
      margin-bottom: 6px;
    }
    #${PRINT_AREA_ID} .cv-expect-label {
      display: block;
      font-size: 8pt;
      color: #94a3b8;
      letter-spacing: 0.4px;
      margin-bottom: 1px;
    }
    #${PRINT_AREA_ID} .cv-side-footer {
      margin-top: auto;
      padding-top: 18px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      text-align: center;
      font-size: 7.5pt;
      color: #94a3b8;
      letter-spacing: 0.6px;
    }
    #${PRINT_AREA_ID} .cv-side-footer .cv-mark {
      color: #f97316;
      font-family: 'Outfit', sans-serif;
      font-weight: 700;
      letter-spacing: 1px;
    }

    /* ── Main (right, white) ─────────────────────────────── */
    #${PRINT_AREA_ID} .cv-main {
      width: 68%;
      background: #ffffff;
      padding: 32px 34px;
      color: #1a1a2e;
      display: flex;
      flex-direction: column;
      gap: 22px;
    }
    #${PRINT_AREA_ID} .cv-main-header {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding-bottom: 14px;
      border-bottom: 0;
      position: relative;
    }
    #${PRINT_AREA_ID} .cv-main-name {
      font-family: 'Outfit', sans-serif;
      font-weight: 800;
      font-size: 26pt;
      color: #1a1a2e;
      margin: 0;
      line-height: 1.05;
      letter-spacing: -0.5px;
    }
    #${PRINT_AREA_ID} .cv-main-title-row {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
      margin-top: 4px;
    }
    #${PRINT_AREA_ID} .cv-main-title {
      color: #f97316;
      font-weight: 600;
      font-size: 13pt;
      font-family: 'Outfit', sans-serif;
    }
    #${PRINT_AREA_ID} .cv-level-badge {
      display: inline-block;
      background: linear-gradient(135deg, #f97316, #ea580c);
      color: #ffffff;
      padding: 3px 10px;
      border-radius: 999px;
      font-size: 8.5pt;
      font-weight: 700;
      letter-spacing: 0.8px;
      text-transform: uppercase;
      font-family: 'Outfit', sans-serif;
    }
    #${PRINT_AREA_ID} .cv-main-divider {
      height: 3px;
      background: linear-gradient(90deg, #f97316 0%, #ea580c 60%, transparent 100%);
      border-radius: 2px;
      margin-top: 10px;
    }
    #${PRINT_AREA_ID} .cv-main-section {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    #${PRINT_AREA_ID} .cv-main-heading {
      font-family: 'Outfit', sans-serif;
      font-weight: 700;
      font-size: 11pt;
      letter-spacing: 2.5px;
      text-transform: uppercase;
      color: #1a1a2e;
      margin: 0;
      padding-bottom: 6px;
      border-bottom: 1.5px solid #1a1a2e;
    }
    #${PRINT_AREA_ID} .cv-summary {
      color: #374151;
      font-size: 10.5pt;
      line-height: 1.6;
      margin: 0;
    }
    #${PRINT_AREA_ID} .cv-exp-entry {
      padding-bottom: 14px;
      margin-bottom: 14px;
      border-bottom: 1px solid #e5e7eb;
    }
    #${PRINT_AREA_ID} .cv-exp-entry:last-child {
      border-bottom: 0;
      margin-bottom: 0;
      padding-bottom: 0;
    }
    #${PRINT_AREA_ID} .cv-exp-row {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      gap: 10px;
      margin-bottom: 2px;
    }
    #${PRINT_AREA_ID} .cv-exp-company {
      font-family: 'Outfit', sans-serif;
      font-weight: 700;
      font-size: 11.5pt;
      color: #1a1a2e;
    }
    #${PRINT_AREA_ID} .cv-exp-dates {
      font-size: 9pt;
      color: #6b7280;
      font-weight: 500;
      white-space: nowrap;
    }
    #${PRINT_AREA_ID} .cv-exp-job {
      color: #f97316;
      font-weight: 600;
      font-size: 10.5pt;
      margin-bottom: 6px;
    }
    #${PRINT_AREA_ID} .cv-exp-bullets {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    #${PRINT_AREA_ID} .cv-exp-bullet {
      position: relative;
      padding-left: 14px;
      margin-bottom: 4px;
      color: #374151;
      font-size: 10pt;
      line-height: 1.5;
    }
    #${PRINT_AREA_ID} .cv-exp-bullet::before {
      content: "";
      position: absolute;
      left: 0;
      top: 7px;
      width: 6px;
      height: 6px;
      background: #f97316;
      border-radius: 1px;
    }
    #${PRINT_AREA_ID} .cv-edu-entry {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      gap: 10px;
      padding: 6px 0;
      border-bottom: 1px solid #f3f4f6;
    }
    #${PRINT_AREA_ID} .cv-edu-entry:last-child { border-bottom: 0; }
    #${PRINT_AREA_ID} .cv-edu-degree {
      font-family: 'Outfit', sans-serif;
      font-weight: 700;
      color: #1a1a2e;
      font-size: 10.5pt;
    }
    #${PRINT_AREA_ID} .cv-edu-school {
      color: #6b7280;
      font-size: 9.5pt;
    }
    #${PRINT_AREA_ID} .cv-edu-dates {
      font-size: 9pt;
      color: #6b7280;
      white-space: nowrap;
    }
  `;
  document.head.appendChild(style);
}

// ── SVG icons (inline so they render in the print PDF) ────────────
const ICONS = {
  pin: `<svg class="cv-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`,
  linkedin: `<svg class="cv-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M20.5 2h-17A1.5 1.5 0 0 0 2 3.5v17A1.5 1.5 0 0 0 3.5 22h17a1.5 1.5 0 0 0 1.5-1.5v-17A1.5 1.5 0 0 0 20.5 2zM8 19H5v-9h3zM6.5 8.25A1.75 1.75 0 1 1 6.5 4.75a1.75 1.75 0 0 1 0 3.5zM19 19h-3v-4.74c0-1.42-.6-1.93-1.38-1.93A1.74 1.74 0 0 0 13 14.19V19h-3v-9h2.9v1.3a3.11 3.11 0 0 1 2.7-1.4c1.55 0 3.36.86 3.36 3.66z"/></svg>`,
  github: `<svg class="cv-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.55 0-.27-.01-.99-.02-1.94-3.2.7-3.88-1.54-3.88-1.54-.52-1.33-1.28-1.69-1.28-1.69-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.18-3.1-.12-.29-.51-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.05 11.05 0 0 1 5.79 0c2.21-1.49 3.18-1.18 3.18-1.18.62 1.59.23 2.76.11 3.05.74.81 1.18 1.84 1.18 3.1 0 4.42-2.69 5.39-5.26 5.68.41.36.78 1.05.78 2.12 0 1.53-.01 2.77-.01 3.14 0 .3.21.67.8.55C20.22 21.39 23.5 17.08 23.5 12 23.5 5.65 18.35.5 12 .5z"/></svg>`,
  portfolio: `<svg class="cv-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>`,
  globe: `<svg class="cv-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 0 20M12 2a15.3 15.3 0 0 0 0 20"/></svg>`,
};

function buildHtml(c: Candidate): string {
  const initials = getInitials(c.fullName);
  const skills = c.skills || { advanced: [], intermediate: [], beginner: [] };
  const exp = Array.isArray(c.experienceEntries) ? c.experienceEntries : [];
  const langs = Array.isArray(c.languages) ? c.languages : [];
  const links = c.links || {};
  const salaryStr = formatSalary(c.salaryMin, c.salaryMax, c.salaryCurrency);

  const contactItems: string[] = [];
  if (c.location) {
    contactItems.push(`<div class="cv-contact-item">${ICONS.pin}<span>${esc(c.location)}</span></div>`);
  }
  if (links.linkedin_url) {
    contactItems.push(`<div class="cv-contact-item">${ICONS.linkedin}<span>${esc(links.linkedin_url.replace(/^https?:\/\//, ""))}</span></div>`);
  }
  if (links.github_url) {
    contactItems.push(`<div class="cv-contact-item">${ICONS.github}<span>${esc(links.github_url.replace(/^https?:\/\//, ""))}</span></div>`);
  }
  if (links.portfolio_url) {
    contactItems.push(`<div class="cv-contact-item">${ICONS.portfolio}<span>${esc(links.portfolio_url.replace(/^https?:\/\//, ""))}</span></div>`);
  }
  if (links.website_url) {
    contactItems.push(`<div class="cv-contact-item">${ICONS.globe}<span>${esc(links.website_url.replace(/^https?:\/\//, ""))}</span></div>`);
  }

  const renderPills = (arr: string[], cls: string) =>
    arr.map((s) => `<span class="cv-pill ${cls}">${esc(s)}</span>`).join("");

  const skillsBlock = (skills.advanced.length || skills.intermediate.length || skills.beginner.length) ? `
    <div class="cv-side-section">
      <h3 class="cv-side-heading">Umiejętności</h3>
      ${skills.advanced.length ? `<div class="cv-skill-group"><p class="cv-skill-label">Zaawansowane</p><div class="cv-pills">${renderPills(skills.advanced, "cv-pill-advanced")}</div></div>` : ""}
      ${skills.intermediate.length ? `<div class="cv-skill-group"><p class="cv-skill-label">Średniozaawansowane</p><div class="cv-pills">${renderPills(skills.intermediate, "cv-pill-intermediate")}</div></div>` : ""}
      ${skills.beginner.length ? `<div class="cv-skill-group"><p class="cv-skill-label">Podstawowe</p><div class="cv-pills">${renderPills(skills.beginner, "cv-pill-basic")}</div></div>` : ""}
    </div>` : "";

  const langsBlock = langs.length ? `
    <div class="cv-side-section">
      <h3 class="cv-side-heading">Języki</h3>
      ${langs.map((l) => `<div class="cv-lang-row"><span>${esc(l.name || "")}</span>${l.level ? `<span class="cv-lang-level">${esc(l.level)}</span>` : ""}</div>`).join("")}
    </div>` : "";

  const expectRows: string[] = [];
  if (salaryStr) expectRows.push(`<div class="cv-expect-row"><span class="cv-expect-label">Wynagrodzenie</span>${esc(salaryStr)}</div>`);
  if (c.workMode) expectRows.push(`<div class="cv-expect-row"><span class="cv-expect-label">Tryb pracy</span>${esc(c.workMode)}</div>`);
  if (c.employmentType) expectRows.push(`<div class="cv-expect-row"><span class="cv-expect-label">Forma zatrudnienia</span>${esc(c.employmentType)}</div>`);
  if (c.availability) expectRows.push(`<div class="cv-expect-row"><span class="cv-expect-label">Dostępność</span>${esc(c.availability)}</div>`);

  const expectBlock = expectRows.length ? `
    <div class="cv-side-section">
      <h3 class="cv-side-heading">Oczekiwania</h3>
      ${expectRows.join("")}
    </div>` : "";

  const expBlock = exp.length ? `
    <section class="cv-main-section">
      <h2 class="cv-main-heading">Doświadczenie zawodowe</h2>
      ${exp.map((e) => `
        <div class="cv-exp-entry">
          <div class="cv-exp-row">
            <span class="cv-exp-company">${esc(e.company_name || "—")}</span>
            <span class="cv-exp-dates">${esc(formatDateRange(e.start_date, e.end_date, !!e.is_current))}</span>
          </div>
          <div class="cv-exp-job">${esc(e.job_title || "")}</div>
          ${Array.isArray(e.description_points) && e.description_points.length ? `
            <ul class="cv-exp-bullets">
              ${e.description_points.filter(Boolean).map((b) => `<li class="cv-exp-bullet">${esc(b)}</li>`).join("")}
            </ul>` : ""}
        </div>`).join("")}
    </section>` : "";

  // Education: not in current Candidate model — render nothing if absent.
  // (Forward-compat: read from (c as any).education if it ever appears.)
  const eduRaw = (c as unknown as { education?: Array<{ degree?: string; school?: string; start_date?: string; end_date?: string; is_current?: boolean }> }).education;
  const eduBlock = Array.isArray(eduRaw) && eduRaw.length ? `
    <section class="cv-main-section">
      <h2 class="cv-main-heading">Wykształcenie</h2>
      ${eduRaw.map((ed) => `
        <div class="cv-edu-entry">
          <div>
            <div class="cv-edu-degree">${esc(ed.degree || "—")}</div>
            <div class="cv-edu-school">${esc(ed.school || "")}</div>
          </div>
          <div class="cv-edu-dates">${esc(formatDateRange(ed.start_date || "", ed.end_date || "", !!ed.is_current))}</div>
        </div>`).join("")}
    </section>` : "";

  return `
    <aside class="cv-sidebar">
      <div>
        <div class="cv-avatar">${esc(initials)}</div>
        <h1 class="cv-side-name">${esc(c.fullName || "Kandydat")}</h1>
        ${c.title ? `<p class="cv-side-title">${esc(c.title)}</p>` : ""}
        <div class="cv-divider"></div>
      </div>

      ${contactItems.length ? `
        <div class="cv-side-section">
          <h3 class="cv-side-heading">Kontakt</h3>
          ${contactItems.join("")}
        </div>` : ""}

      ${skillsBlock}
      ${langsBlock}
      ${expectBlock}

      <div class="cv-side-footer">
        Wygenerowane przez <span class="cv-mark">JobSwipe.pl</span>
      </div>
    </aside>

    <main class="cv-main">
      <header class="cv-main-header">
        <h1 class="cv-main-name">${esc(c.fullName || "Kandydat")}</h1>
        <div class="cv-main-title-row">
          ${c.title ? `<span class="cv-main-title">${esc(c.title)}</span>` : ""}
          ${c.seniority ? `<span class="cv-level-badge">${esc(c.seniority)}</span>` : ""}
        </div>
        <div class="cv-main-divider"></div>
      </header>

      ${c.summary ? `
        <section class="cv-main-section">
          <h2 class="cv-main-heading">Podsumowanie</h2>
          <p class="cv-summary">${esc(c.summary)}</p>
        </section>` : ""}

      ${expBlock}
      ${eduBlock}
    </main>
  `;
}

function renderAndPrint(candidate: Candidate) {
  ensureFonts();
  ensurePrintStyles();

  // Remove any stale node first
  const stale = document.getElementById(PRINT_AREA_ID);
  if (stale) stale.remove();

  const container = document.createElement("div");
  container.id = PRINT_AREA_ID;
  container.innerHTML = buildHtml(candidate);
  document.body.appendChild(container);

  // Cleanup after print dialog closes
  const cleanup = () => {
    const node = document.getElementById(PRINT_AREA_ID);
    if (node) node.remove();
    window.removeEventListener("afterprint", cleanup);
  };
  window.addEventListener("afterprint", cleanup);

  // Slight delay so fonts/layout settle before the print dialog snapshots
  setTimeout(() => {
    try {
      window.print();
    } catch (e) {
      console.warn("print failed", e);
      cleanup();
    }
  }, 350);
}

/**
 * Public entry: fetch candidate by user_id (RLS allows the user themselves
 * and employers with valid shortlist access) then trigger client-side print.
 */
export async function downloadCandidateProfilePdf(candidateUserId: string) {
  try {
    const candidate = await getProvider("candidates").getByUserId(candidateUserId);
    if (!candidate) {
      toast.error("Nie znaleziono profilu kandydata.");
      return;
    }
    renderAndPrint(candidate);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "spróbuj ponownie";
    toast.error(`Nie udało się wygenerować PDF: ${msg}`);
  }
}
