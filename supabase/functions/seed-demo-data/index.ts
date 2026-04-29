import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") ?? "https://www.jobswipe.pl",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/** Deterministic UUIDs for demo entities */
const IDS = {
  candidateUser: "aaaaaaaa-0000-0000-0000-000000000001",
  employerUser:  "aaaaaaaa-0000-0000-0000-000000000002",
  jobs: [
    "bbbbbbbb-0000-0000-0000-000000000001",
    "bbbbbbbb-0000-0000-0000-000000000002",
    "bbbbbbbb-0000-0000-0000-000000000003",
    "bbbbbbbb-0000-0000-0000-000000000004",
    "bbbbbbbb-0000-0000-0000-000000000005",
  ],
  applications: [
    "cccccccc-0000-0000-0000-000000000001",
    "cccccccc-0000-0000-0000-000000000002",
  ],
  messages: [
    "dddddddd-0000-0000-0000-000000000001",
    "dddddddd-0000-0000-0000-000000000002",
    "dddddddd-0000-0000-0000-000000000003",
  ],
  savedJobs: [
    "eeeeeeee-0000-0000-0000-000000000001",
  ],
  swipeEvents: [
    "ffffffff-0000-0000-0000-000000000001",
    "ffffffff-0000-0000-0000-000000000002",
    "ffffffff-0000-0000-0000-000000000003",
    "ffffffff-0000-0000-0000-000000000004",
  ],
  notifications: [
    "11111111-0000-0000-0000-000000000001",
    "11111111-0000-0000-0000-000000000002",
  ],
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  // ── Security gate: require admin secret ──
  const expectedSecret = Deno.env.get("ADMIN_SECRET");
  const providedSecret =
    req.headers.get("x-admin-secret") ?? new URL(req.url).searchParams.get("secret");
  if (!expectedSecret || providedSecret !== expectedSecret) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const results: string[] = [];

  try {
    // ── 1. Create demo auth users ──
    for (const [label, id, email, role] of [
      ["candidate", IDS.candidateUser, "candidate@demo.jobswipe.pl", "candidate"],
      ["employer", IDS.employerUser, "employer@demo.jobswipe.pl", "employer"],
    ] as const) {
      const { error: delErr } = await admin.auth.admin.deleteUser(id).catch(() => ({ error: null }));
      const { error } = await admin.auth.admin.createUser({
        id,
        email,
        password: "demo1234",
        email_confirm: true,
        user_metadata: { role, full_name: label === "candidate" ? "Anna Kowalska" : "Jan Nowak" },
      });
      if (error && !error.message.includes("already")) {
        results.push(`⚠️ ${label} user: ${error.message}`);
      } else {
        results.push(`✅ ${label} user ready (${email} / demo1234)`);
      }
    }

    // ── 2. Ensure profiles exist (trigger should create, but upsert to be safe) ──
    await admin.from("profiles").upsert([
      { user_id: IDS.candidateUser, role: "candidate", full_name: "Anna Kowalska", avatar: "👩‍💻" },
      { user_id: IDS.employerUser, role: "employer", full_name: "Jan Nowak", avatar: "👔" },
    ], { onConflict: "user_id" });
    results.push("✅ profiles upserted");

    // ── 3. Candidate record ──
    await admin.from("candidates").upsert([{
      user_id: IDS.candidateUser,
      title: "Senior Frontend Developer",
      location: "Warszawa",
      bio: "Pasjonatka React i TypeScript z 6-letnim doświadczeniem w tworzeniu aplikacji SaaS.",
      experience: "6 lat",
      skills: ["React", "TypeScript", "Node.js", "Tailwind CSS", "PostgreSQL", "GraphQL"],
      seniority: "Senior",
      work_mode: "Remote",
      employment_type: "Full-time",
      salary_min: 18000,
      salary_max: 26000,
      availability: "2 tygodnie",
      summary: "Szukam ambitnych projektów w nowoczesnym stacku technologicznym.",
      experience_entries: JSON.stringify([
        { title: "Senior Frontend Dev", company: "CloudApp", startDate: "2021-03", endDate: "present", bullets: ["Led React migration", "Built design system"] },
        { title: "Frontend Developer", company: "StartupXYZ", startDate: "2018-06", endDate: "2021-02", bullets: ["Developed SPA dashboard", "Improved performance 40%"] },
      ]),
      links: JSON.stringify({ github: "https://github.com/anna-demo", linkedin: "https://linkedin.com/in/anna-demo" }),
    }], { onConflict: "user_id" });
    results.push("✅ candidate record upserted");

    // ── 4. Jobs ──
    const jobsData = [
      { id: IDS.jobs[0], title: "Frontend Engineer", company: "TechNova", logo: "🚀", location: "Warszawa", salary: "18 000 - 25 000 PLN", type: "Full-time", tags: ["React", "TypeScript", "Tailwind CSS"], description: "Dołącz do zespołu budującego platformę SaaS nowej generacji.", employer_id: IDS.employerUser, status: "active" },
      { id: IDS.jobs[1], title: "Full Stack Developer", company: "DataFlow", logo: "📊", location: "Kraków", salary: "20 000 - 28 000 PLN", type: "Remote", tags: ["Node.js", "React", "PostgreSQL", "Docker"], description: "Budujemy narzędzia analityczne dla dużych firm. Szukamy full-stacka.", employer_id: IDS.employerUser, status: "active" },
      { id: IDS.jobs[2], title: "React Native Developer", company: "MobiApp", logo: "📱", location: "Wrocław", salary: "16 000 - 22 000 PLN", type: "Full-time", tags: ["React Native", "TypeScript", "Firebase"], description: "Tworzymy aplikację mobilną z milionami użytkowników.", employer_id: IDS.employerUser, status: "active" },
      { id: IDS.jobs[3], title: "DevOps Engineer", company: "CloudBase", logo: "☁️", location: "Zdalnie", salary: "22 000 - 30 000 PLN", type: "Remote", tags: ["AWS", "Terraform", "Kubernetes", "CI/CD"], description: "Zarządzaj infrastrukturą chmurową dla klientów enterprise.", employer_id: IDS.employerUser, status: "active" },
      { id: IDS.jobs[4], title: "UI/UX Designer", company: "DesignHub", logo: "🎨", location: "Gdańsk", salary: "14 000 - 20 000 PLN", type: "Contract", tags: ["Figma", "UX Research", "Design Systems"], description: "Projektuj interfejsy, które kochają użytkownicy.", employer_id: IDS.employerUser, status: "active" },
    ];
    await admin.from("jobs").upsert(jobsData, { onConflict: "id" });
    results.push(`✅ ${jobsData.length} jobs upserted`);

    // ── 5. Applications ──
    await admin.from("applications").upsert([
      { id: IDS.applications[0], candidate_id: IDS.candidateUser, job_id: IDS.jobs[0], source: "candidate", status: "applied" },
      { id: IDS.applications[1], candidate_id: IDS.candidateUser, job_id: IDS.jobs[1], source: "candidate", status: "screening" },
    ], { onConflict: "id" });
    results.push("✅ 2 applications upserted");

    // ── 6. Messages ──
    await admin.from("messages").upsert([
      { id: IDS.messages[0], application_id: IDS.applications[0], sender_id: IDS.employerUser, content: "Cześć Anna! Dziękujemy za aplikację. Chcielibyśmy umówić krótką rozmowę." },
      { id: IDS.messages[1], application_id: IDS.applications[0], sender_id: IDS.candidateUser, content: "Dzień dobry! Chętnie porozmawiam. Kiedy Państwu pasuje?" },
      { id: IDS.messages[2], application_id: IDS.applications[0], sender_id: IDS.employerUser, content: "Może środa o 14:00? Wyślemy link do Google Meet." },
    ], { onConflict: "id" });
    results.push("✅ 3 messages upserted");

    // ── 7. Saved jobs ──
    await admin.from("saved_jobs").upsert([
      { id: IDS.savedJobs[0], user_id: IDS.candidateUser, job_id: IDS.jobs[2] },
    ], { onConflict: "id" });
    results.push("✅ 1 saved job upserted");

    // ── 8. Swipe events ──
    await admin.from("swipe_events").upsert([
      { id: IDS.swipeEvents[0], user_id: IDS.candidateUser, job_id: IDS.jobs[0], direction: "right" },
      { id: IDS.swipeEvents[1], user_id: IDS.candidateUser, job_id: IDS.jobs[1], direction: "right" },
      { id: IDS.swipeEvents[2], user_id: IDS.candidateUser, job_id: IDS.jobs[2], direction: "save" },
      { id: IDS.swipeEvents[3], user_id: IDS.candidateUser, job_id: IDS.jobs[3], direction: "left" },
    ], { onConflict: "id" });
    results.push("✅ 4 swipe events upserted");

    // ── 9. Notifications ──
    await admin.from("notifications").upsert([
      { id: IDS.notifications[0], user_id: IDS.candidateUser, type: "status_change", title: "Zmiana statusu", body: "Twoja aplikacja w TechNova przeszła do etapu rozmowy.", reference_id: IDS.applications[0], read: false },
      { id: IDS.notifications[1], user_id: IDS.candidateUser, type: "new_message", title: "Nowa wiadomość", body: "Otrzymałeś wiadomość od TechNova.", reference_id: IDS.applications[0], read: false },
    ], { onConflict: "id" });
    results.push("✅ 2 notifications upserted");

    return new Response(JSON.stringify({ ok: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: String(err), results }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
