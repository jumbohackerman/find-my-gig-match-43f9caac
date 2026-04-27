// Block 6 — Unified email dispatcher for JobSwipe (HARDENED).
//
// Bezpieczeństwo:
//  - allowlist obsługiwanych typów (żadnych dowolnych to/subject/html)
//  - autoryzacja: pracodawca musi być właścicielem `job_id`, dla operacji
//    per-kandydat sprawdzamy że candidate faktycznie ma aplikację na ten job
//  - shortlist_complete / position_closed mogą być wywołane TYLKO przez
//    service role (np. z innej edge function), nie z przeglądarki użytkownika
//  - przy braku RESEND_API_KEY działa w trybie DRY-RUN i jasno to zwraca
//
// Obsługiwane typy:
//   - contact_invitation   (employer → kandydat)
//   - shortlist_complete   (system / run-shortlist, service role only)
//   - position_closed      (system, service role only)
//   - status_change        (employer → kandydat)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") ?? "https://www.jobswipe.pl",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ALLOWED_TYPES = new Set([
  "contact_invitation",
  "shortlist_complete",
  "position_closed",
  "status_change",
]);

// Typy, które wolno wywołać tylko z poziomu serwera (service role JWT).
const SERVER_ONLY_TYPES = new Set(["shortlist_complete", "position_closed"]);

// Limity długości wiadomości od pracodawcy, żeby nie dało się wstrzyknąć
// gigantycznego HTML/treści jako "employer_message".
const MAX_EMPLOYER_MESSAGE_LEN = 2000;

// ────────────────────────────────────────────────────────────────────────────
// Sanityzacja — usuwamy wszelkie tagi HTML z user-generated input,
// żeby nie dało się wstrzyknąć skryptów/linków.
// ────────────────────────────────────────────────────────────────────────────
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function safe(s: unknown, max = 200): string {
  if (typeof s !== "string") return "";
  return escapeHtml(s.slice(0, max));
}

// ────────────────────────────────────────────────────────────────────────────
// EMAIL TEMPLATES
// ────────────────────────────────────────────────────────────────────────────
const wrap = (body: string) =>
  `<!doctype html><html><body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#1a1a1a;background:#ffffff;">${body}<hr style="border:none;border-top:1px solid #e5e5e5;margin:32px 0 16px"/><p style="font-size:12px;color:#888">Wiadomość wysłana automatycznie przez JobSwipe. Nie odpowiadaj na ten adres.</p></body></html>`;

const TEMPLATES = {
  shortlisted: (candidateName: string, jobTitle: string, company: string) => ({
    subject: `Gratulacje! Twoja aplikacja na "${jobTitle}" przeszła do shortlisty`,
    html: wrap(`
      <h2 style="color:#f97316">🎉 Jesteś w shortliście AI</h2>
      <p>Cześć ${safe(candidateName)},</p>
      <p>Twoja aplikacja na stanowisko <strong>${safe(jobTitle)}</strong> w firmie <strong>${safe(company)}</strong> została wybrana do shortlisty kandydatów.</p>
      <p>Śledź status w panelu JobSwipe.</p>
      <p>Powodzenia!<br/>Zespół JobSwipe</p>
    `),
  }),
  rejected: (candidateName: string, jobTitle: string, company: string, feedbackPoints: string[]) => ({
    subject: `Informacja o statusie aplikacji na "${jobTitle}"`,
    html: wrap(`
      <h2>Informacja o aplikacji</h2>
      <p>Cześć ${safe(candidateName)},</p>
      <p>Dziękujemy za aplikację na <strong>${safe(jobTitle)}</strong> w firmie <strong>${safe(company)}</strong>.</p>
      <ul>${(feedbackPoints ?? []).slice(0, 10).map((p) => `<li style="margin:6px 0">${safe(p, 500)}</li>`).join("")}</ul>
      <p>Powodzenia w dalszej rekrutacji!<br/>Zespół JobSwipe</p>
    `),
  }),
  contactInvitation: (candidateName: string, jobTitle: string, company: string, employerMessage: string) => ({
    subject: `Pracodawca wysłał Ci zaproszenie do kontaktu — ${jobTitle}`,
    html: wrap(`
      <h2 style="color:#f97316">📩 Zaproszenie do kontaktu</h2>
      <p>Cześć ${safe(candidateName)},</p>
      <p>Pracodawca z firmy <strong>${safe(company)}</strong> zaprasza Cię do kontaktu w sprawie stanowiska <strong>${safe(jobTitle)}</strong>.</p>
      ${employerMessage ? `<blockquote style="border-left:3px solid #f97316;padding:8px 12px;margin:16px 0;background:#fff7ed;color:#1a1a1a">${safe(employerMessage, MAX_EMPLOYER_MESSAGE_LEN)}</blockquote>` : ""}
      <p>Zaloguj się do JobSwipe, aby zaakceptować lub odrzucić zaproszenie.</p>
      <p>Zespół JobSwipe</p>
    `),
  }),
  positionClosedNoContact: (candidateName: string, jobTitle: string, company: string) => ({
    subject: `Rekrutacja na "${jobTitle}" została zakończona`,
    html: wrap(`
      <h2>Rekrutacja zakończona</h2>
      <p>Cześć ${safe(candidateName)},</p>
      <p>Rekrutacja na <strong>${safe(jobTitle)}</strong> w firmie <strong>${safe(company)}</strong> została zakończona.</p>
      <p>Powodzenia!<br/>Zespół JobSwipe</p>
    `),
  }),
  statusChange: (candidateName: string, jobTitle: string, newStatus: string) => ({
    subject: `Aktualizacja statusu aplikacji — ${jobTitle}`,
    html: wrap(`
      <h2>Aktualizacja statusu</h2>
      <p>Cześć ${safe(candidateName)},</p>
      <p>Status Twojej aplikacji na <strong>${safe(jobTitle)}</strong> zmienił się na: <strong>${safe(newStatus, 80)}</strong>.</p>
      <p>Zespół JobSwipe</p>
    `),
  }),
};

// ────────────────────────────────────────────────────────────────────────────
// Dispatcher z dry-run fallback
// ────────────────────────────────────────────────────────────────────────────
type SendResult = { ok: boolean; id?: string; error?: string; dryRun?: boolean };

async function sendViaResend(to: string, subject: string, html: string): Promise<SendResult> {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  const from = Deno.env.get("RESEND_FROM_EMAIL") ?? "JobSwipe <noreply@jobswipe.pl>";
  if (!apiKey) {
    console.log("[send-email][DRY-RUN] email NIE został wysłany:", { to, subject });
    return { ok: true, id: "dry-run", dryRun: true };
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to, subject, html }),
    });
    const data = await res.json();
    if (!res.ok) {
      console.error("[send-email] Resend error:", data);
      return { ok: false, error: data?.message ?? "Resend API error" };
    }
    return { ok: true, id: data.id };
  } catch (e) {
    console.error("[send-email] fetch error:", e);
    return { ok: false, error: (e as Error).message };
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────
async function getCandidateContact(
  supabase: ReturnType<typeof createClient>,
  candidateId: string,
): Promise<{ email: string | null; name: string }> {
  const { data: authUser } = await supabase.auth.admin.getUserById(candidateId);
  const email = authUser?.user?.email ?? null;
  const { data: candidate } = await supabase.from("candidates").select("full_name").eq("user_id", candidateId).maybeSingle();
  const { data: profile } = await supabase.from("profiles").select("full_name").eq("user_id", candidateId).maybeSingle();
  const name = (candidate?.full_name as string) || (profile?.full_name as string) || "Kandydacie";
  return { email, name };
}

async function assertEmployerOwnsJob(
  supabase: ReturnType<typeof createClient>,
  employerId: string,
  jobId: string,
): Promise<{ title: string; company: string }> {
  const { data: job, error } = await supabase
    .from("jobs")
    .select("id, employer_id, title, company")
    .eq("id", jobId)
    .maybeSingle();
  if (error || !job) throw new Error("FORBIDDEN: job not found");
  if ((job as any).employer_id !== employerId) throw new Error("FORBIDDEN: not job owner");
  return { title: (job as any).title, company: (job as any).company };
}

async function assertCandidateAppliedToJob(
  supabase: ReturnType<typeof createClient>,
  candidateId: string,
  jobId: string,
): Promise<void> {
  const { data, error } = await supabase
    .from("applications")
    .select("id")
    .eq("candidate_id", candidateId)
    .eq("job_id", jobId)
    .maybeSingle();
  if (error || !data) throw new Error("FORBIDDEN: candidate has no application for this job");
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ────────────────────────────────────────────────────────────────────────────
// Main handler
// ────────────────────────────────────────────────────────────────────────────
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const body = await req.json().catch(() => ({}));
    const type = String(body?.type ?? "");

    // 1) Allowlist typów — żadne legacy to/subject/html nie jest akceptowane.
    if (!ALLOWED_TYPES.has(type)) {
      return jsonResponse(
        {
          error: "UNSUPPORTED_EMAIL_TYPE",
          message: `Typ emaila nie jest obsługiwany. Dozwolone: ${[...ALLOWED_TYPES].join(", ")}`,
        },
        400,
      );
    }

    // 2) Identyfikacja wywołującego.
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    const isServiceRoleCall = !!token && token === serviceKey;

    let callerUserId: string | null = null;
    if (!isServiceRoleCall && token) {
      const { data: userData } = await createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: `Bearer ${token}` } },
      }).auth.getUser();
      callerUserId = userData?.user?.id ?? null;
    }

    // 3) Typy server-only mogą być uruchamiane wyłącznie z service role.
    if (SERVER_ONLY_TYPES.has(type) && !isServiceRoleCall) {
      return jsonResponse(
        { error: "FORBIDDEN", message: "Ten typ emaila może być wywołany tylko przez system." },
        403,
      );
    }

    // 4) Dla typów wymagających usera musi istnieć zalogowany pracodawca.
    if (!SERVER_ONLY_TYPES.has(type) && !isServiceRoleCall && !callerUserId) {
      return jsonResponse({ error: "UNAUTHORIZED", message: "Wymagane logowanie." }, 401);
    }

    // ──── contact_invitation (employer → kandydat) ────────────────────
    if (type === "contact_invitation") {
      const candidateId = String(body.candidate_id ?? "");
      const jobId = String(body.job_id ?? "");
      const employerMessage = String(body.employer_message ?? "").slice(0, MAX_EMPLOYER_MESSAGE_LEN);
      if (!candidateId || !jobId) {
        return jsonResponse({ error: "BAD_REQUEST", message: "candidate_id i job_id są wymagane." }, 400);
      }

      // Autoryzacja: pracodawca musi być właścicielem joba i kandydat musi mieć aplikację.
      let jobInfo: { title: string; company: string };
      if (isServiceRoleCall) {
        const { data: job } = await supabase
          .from("jobs")
          .select("title, company")
          .eq("id", jobId)
          .maybeSingle();
        if (!job) return jsonResponse({ error: "NOT_FOUND", message: "Oferta nie istnieje." }, 404);
        jobInfo = { title: (job as any).title, company: (job as any).company };
      } else {
        jobInfo = await assertEmployerOwnsJob(supabase, callerUserId!, jobId);
      }
      await assertCandidateAppliedToJob(supabase, candidateId, jobId);

      const { email, name } = await getCandidateContact(supabase, candidateId);
      if (!email) return jsonResponse({ success: false, error: "no_email" });

      const tpl = TEMPLATES.contactInvitation(name, jobInfo.title, jobInfo.company, employerMessage);
      const r = await sendViaResend(email, tpl.subject, tpl.html);
      return jsonResponse(r);
    }

    // ──── status_change (employer → kandydat) ─────────────────────────
    if (type === "status_change") {
      const candidateId = String(body.candidate_id ?? "");
      const jobId = String(body.job_id ?? "");
      const newStatus = String(body.new_status ?? "").slice(0, 80);
      if (!candidateId || !jobId || !newStatus) {
        return jsonResponse({ error: "BAD_REQUEST", message: "candidate_id, job_id i new_status są wymagane." }, 400);
      }

      let jobInfo: { title: string; company: string };
      if (isServiceRoleCall) {
        const { data: job } = await supabase.from("jobs").select("title, company").eq("id", jobId).maybeSingle();
        if (!job) return jsonResponse({ error: "NOT_FOUND" }, 404);
        jobInfo = { title: (job as any).title, company: (job as any).company };
      } else {
        jobInfo = await assertEmployerOwnsJob(supabase, callerUserId!, jobId);
      }
      await assertCandidateAppliedToJob(supabase, candidateId, jobId);

      const { email, name } = await getCandidateContact(supabase, candidateId);
      if (!email) return jsonResponse({ success: false, error: "no_email" });
      const tpl = TEMPLATES.statusChange(name, jobInfo.title, newStatus);
      const r = await sendViaResend(email, tpl.subject, tpl.html);
      return jsonResponse(r);
    }

    // ──── shortlist_complete (system, service role only) ──────────────
    if (type === "shortlist_complete") {
      const { job_id, top5_ids, rejected_feedbacks } = body as {
        job_id?: string;
        top5_ids?: string[];
        rejected_feedbacks?: { candidate_id: string; feedback_points: string[] }[];
      };
      if (!job_id) return jsonResponse({ error: "BAD_REQUEST", message: "job_id required" }, 400);

      const { data: job } = await supabase.from("jobs").select("title, company").eq("id", job_id).maybeSingle();
      if (!job) return jsonResponse({ error: "NOT_FOUND" }, 404);
      const { title, company } = job as any;

      const results: SendResult[] = [];
      for (const id of (top5_ids ?? []).slice(0, 50)) {
        const { email, name } = await getCandidateContact(supabase, id);
        if (!email) continue;
        const tpl = TEMPLATES.shortlisted(name, title, company);
        results.push(await sendViaResend(email, tpl.subject, tpl.html));
      }
      for (const r of (rejected_feedbacks ?? []).slice(0, 200)) {
        const { email, name } = await getCandidateContact(supabase, r.candidate_id);
        if (!email) continue;
        const tpl = TEMPLATES.rejected(name, title, company, r.feedback_points ?? []);
        results.push(await sendViaResend(email, tpl.subject, tpl.html));
      }
      const dryRun = results.some((x) => x.dryRun);
      return jsonResponse({ success: true, count: results.length, dryRun });
    }

    // ──── position_closed (system, service role only) ─────────────────
    if (type === "position_closed") {
      const { job_id, candidate_ids } = body as { job_id?: string; candidate_ids?: string[] };
      if (!job_id) return jsonResponse({ error: "BAD_REQUEST", message: "job_id required" }, 400);
      const { data: job } = await supabase.from("jobs").select("title, company").eq("id", job_id).maybeSingle();
      if (!job) return jsonResponse({ error: "NOT_FOUND" }, 404);
      const { title, company } = job as any;

      const results: SendResult[] = [];
      for (const id of (candidate_ids ?? []).slice(0, 200)) {
        const { email, name } = await getCandidateContact(supabase, id);
        if (!email) continue;
        const tpl = TEMPLATES.positionClosedNoContact(name, title, company);
        results.push(await sendViaResend(email, tpl.subject, tpl.html));
      }
      const dryRun = results.some((x) => x.dryRun);
      return jsonResponse({ success: true, count: results.length, dryRun });
    }

    // (allowlist już to wyklucza, ale dla pewności)
    return jsonResponse({ error: "UNSUPPORTED_EMAIL_TYPE" }, 400);
  } catch (error) {
    const msg = (error as Error).message ?? "internal_error";
    const status = msg.startsWith("FORBIDDEN") ? 403 : msg.startsWith("UNAUTHORIZED") ? 401 : 500;
    console.error("[send-email] error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
