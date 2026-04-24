// Block 6 — Unified email dispatcher for JobSwipe.
// Handles: shortlist_complete (batch), contact_invitation, position_closed, status_change.
// Uses Resend via RESEND_API_KEY + RESEND_FROM_EMAIL. If keys are missing, runs in
// dry-run mode (logs only) so the rest of the flow keeps working pre-launch.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") ?? "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ────────────────────────────────────────────────────────────────────────────
// EMAIL TEMPLATES — edit these strings after migration to customize copy.
// ────────────────────────────────────────────────────────────────────────────

const wrap = (body: string) => `<!doctype html><html><body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#1a1a1a;background:#ffffff;">${body}<hr style="border:none;border-top:1px solid #e5e5e5;margin:32px 0 16px"/><p style="font-size:12px;color:#888">Wiadomość wysłana automatycznie przez JobSwipe. Nie odpowiadaj na ten adres.</p></body></html>`;

const TEMPLATES = {
  shortlisted: (candidateName: string, jobTitle: string, company: string) => ({
    subject: `Gratulacje! Twoja aplikacja na "${jobTitle}" przeszła do shortlisty`,
    html: wrap(`
      <h2 style="color:#f97316">🎉 Jesteś w shortliście AI</h2>
      <p>Cześć ${candidateName},</p>
      <p>Mamy świetne wiadomości! Twoja aplikacja na stanowisko <strong>${jobTitle}</strong> w firmie <strong>${company}</strong> została wybrana przez system AI JobSwipe do shortlisty najlepszych kandydatów.</p>
      <p>Co to oznacza? Pracodawca przejrzał shortlistę i może wkrótce wysłać Ci zaproszenie do kontaktu. Nie gwarantuje to zaproszenia na rozmowę — to decyzja pracodawcy.</p>
      <p>Śledź status swojej aplikacji w panelu JobSwipe.</p>
      <p>Powodzenia!<br/>Zespół JobSwipe</p>
    `),
  }),

  rejected: (candidateName: string, jobTitle: string, company: string, feedbackPoints: string[]) => ({
    subject: `Informacja o statusie aplikacji na "${jobTitle}"`,
    html: wrap(`
      <h2>Informacja o aplikacji</h2>
      <p>Cześć ${candidateName},</p>
      <p>Dziękujemy za aplikację na stanowisko <strong>${jobTitle}</strong> w firmie <strong>${company}</strong>.</p>
      <p>Po analizie przez system AI JobSwipe Twoja aplikacja nie znalazła się w shortliście kandydatów. Poniżej znajdziesz wskazówki, które mogą pomóc Ci w przyszłych aplikacjach:</p>
      <ul>${feedbackPoints.map((p) => `<li style="margin:6px 0">${p}</li>`).join("")}</ul>
      <p>Nie zniechęcaj się — każda aplikacja to krok naprzód. Regularnie dodawaj nowe umiejętności do profilu i aplikuj na oferty dopasowane do Twojego poziomu.</p>
      <p>Powodzenia w dalszej rekrutacji!<br/>Zespół JobSwipe</p>
    `),
  }),

  contactInvitation: (candidateName: string, jobTitle: string, company: string, employerMessage: string) => ({
    subject: `Pracodawca wysłał Ci zaproszenie do kontaktu — ${jobTitle}`,
    html: wrap(`
      <h2 style="color:#f97316">📩 Zaproszenie do kontaktu</h2>
      <p>Cześć ${candidateName},</p>
      <p>Pracodawca z firmy <strong>${company}</strong> zaprasza Cię do kontaktu w związku z aplikacją na stanowisko <strong>${jobTitle}</strong>.</p>
      ${employerMessage ? `<blockquote style="border-left:3px solid #f97316;padding:8px 12px;margin:16px 0;background:#fff7ed;color:#1a1a1a">${employerMessage}</blockquote>` : ""}
      <p>Zaloguj się do JobSwipe, aby zaakceptować lub odrzucić zaproszenie.</p>
      <p style="color:#666;font-size:13px">Masz 7 dni na odpowiedź.</p>
      <p>Zespół JobSwipe</p>
    `),
  }),

  positionClosedNoContact: (candidateName: string, jobTitle: string, company: string) => ({
    subject: `Rekrutacja na "${jobTitle}" została zakończona`,
    html: wrap(`
      <h2>Rekrutacja zakończona</h2>
      <p>Cześć ${candidateName},</p>
      <p>Informujemy, że rekrutacja na stanowisko <strong>${jobTitle}</strong> w firmie <strong>${company}</strong> została zakończona.</p>
      <p>Byłeś/aś w shortliście najlepszych kandydatów, jednak pracodawca nie nawiązał kontaktu w ramach tej rekrutacji.</p>
      <p>Nie poddawaj się — Twój profil jest wartościowy. Aplikuj na kolejne oferty dopasowane do Twoich umiejętności.</p>
      <p>Powodzenia!<br/>Zespół JobSwipe</p>
    `),
  }),

  statusChange: (candidateName: string, jobTitle: string, newStatus: string) => ({
    subject: `Aktualizacja statusu aplikacji — ${jobTitle}`,
    html: wrap(`
      <h2>Aktualizacja statusu</h2>
      <p>Cześć ${candidateName},</p>
      <p>Status Twojej aplikacji na stanowisko <strong>${jobTitle}</strong> zmienił się na: <strong>${newStatus}</strong>.</p>
      <p>Sprawdź szczegóły w swoim panelu JobSwipe.</p>
      <p>Zespół JobSwipe</p>
    `),
  }),
};

// ────────────────────────────────────────────────────────────────────────────
// Resend dispatcher (with dry-run fallback).
// ────────────────────────────────────────────────────────────────────────────
async function sendViaResend(to: string, subject: string, html: string): Promise<{ ok: boolean; id?: string; error?: string }> {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  const from = Deno.env.get("RESEND_FROM_EMAIL") ?? "JobSwipe <noreply@jobswipe.pl>";
  if (!apiKey) {
    console.log("[send-email][DRY-RUN]", { to, subject });
    return { ok: true, id: "dry-run" };
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
async function getCandidateContact(supabase: ReturnType<typeof createClient>, candidateId: string): Promise<{ email: string | null; name: string }> {
  const { data: authUser } = await supabase.auth.admin.getUserById(candidateId);
  const email = authUser?.user?.email ?? null;
  const { data: candidate } = await supabase.from("candidates").select("full_name").eq("user_id", candidateId).maybeSingle();
  const { data: profile } = await supabase.from("profiles").select("full_name").eq("user_id", candidateId).maybeSingle();
  const name = candidate?.full_name || profile?.full_name || "Kandydacie";
  return { email, name };
}

// ────────────────────────────────────────────────────────────────────────────
// Main handler
// ────────────────────────────────────────────────────────────────────────────
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const body = await req.json();
    const type = body.type as string;

    // ──── shortlist_complete ─────────────────────────────────────────
    if (type === "shortlist_complete") {
      const { job_title, company_name, top5_ids, rejected_feedbacks } = body as {
        job_title: string;
        company_name: string;
        top5_ids: string[];
        rejected_feedbacks: { candidate_id: string; feedback_points: string[] }[];
      };
      const results: unknown[] = [];

      for (const id of top5_ids ?? []) {
        const { email, name } = await getCandidateContact(supabase, id);
        if (!email) continue;
        const tpl = TEMPLATES.shortlisted(name, job_title, company_name);
        results.push(await sendViaResend(email, tpl.subject, tpl.html));
      }
      for (const r of rejected_feedbacks ?? []) {
        const { email, name } = await getCandidateContact(supabase, r.candidate_id);
        if (!email) continue;
        const tpl = TEMPLATES.rejected(name, job_title, company_name, r.feedback_points ?? []);
        results.push(await sendViaResend(email, tpl.subject, tpl.html));
      }
      return new Response(JSON.stringify({ success: true, count: results.length }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ──── contact_invitation ─────────────────────────────────────────
    if (type === "contact_invitation") {
      const { candidate_id, job_title, company_name, employer_message } = body;
      const { email, name } = await getCandidateContact(supabase, candidate_id);
      if (!email) return new Response(JSON.stringify({ success: false, error: "no email" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const tpl = TEMPLATES.contactInvitation(name, job_title, company_name, employer_message ?? "");
      const r = await sendViaResend(email, tpl.subject, tpl.html);
      return new Response(JSON.stringify(r), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ──── position_closed ────────────────────────────────────────────
    if (type === "position_closed") {
      const { candidate_ids, job_title, company_name } = body as { candidate_ids: string[]; job_title: string; company_name: string };
      const results: unknown[] = [];
      for (const id of candidate_ids ?? []) {
        const { email, name } = await getCandidateContact(supabase, id);
        if (!email) continue;
        const tpl = TEMPLATES.positionClosedNoContact(name, job_title, company_name);
        results.push(await sendViaResend(email, tpl.subject, tpl.html));
      }
      return new Response(JSON.stringify({ success: true, count: results.length }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ──── status_change ──────────────────────────────────────────────
    if (type === "status_change") {
      const { candidate_id, job_title, new_status } = body;
      const { email, name } = await getCandidateContact(supabase, candidate_id);
      if (!email) return new Response(JSON.stringify({ success: false, error: "no email" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const tpl = TEMPLATES.statusChange(name, job_title, new_status);
      const r = await sendViaResend(email, tpl.subject, tpl.html);
      return new Response(JSON.stringify(r), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ──── legacy direct send (backward compat) ───────────────────────
    if (body.to && body.subject && body.html) {
      const r = await sendViaResend(body.to, body.subject, body.html);
      return new Response(JSON.stringify(r), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "Unknown email type" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[send-email] error:", error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
