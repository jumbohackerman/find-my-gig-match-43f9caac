import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Briefcase, Search } from "lucide-react";
import { motion } from "framer-motion";
import SeekerCard from "@/components/SeekerCard";
import CandidateProfileModal from "@/components/CandidateProfileModal";
import type { ExtendedSeeker } from "@/components/CandidateProfileModal";
import { useCandidates } from "@/hooks/useCandidates";
import type { Candidate } from "@/domain/models";

/** Map domain Candidate to the shape SeekerCard/CandidateProfileModal expect */
function candidateToSeeker(c: Candidate): ExtendedSeeker {
  return {
    id: c.id,
    name: c.title, // fallback — name not in Candidate model yet
    avatar: "👤",
    title: c.title,
    location: c.location,
    bio: c.bio,
    experience: c.experience,
    skills: c.skills,
    availability: c.availability as any,
    seniority: c.seniority,
    summary: c.summary,
    work_mode: c.workMode,
    employment_type: c.employmentType,
    salary_min: c.salaryMin,
    salary_max: c.salaryMax,
    experience_entries: c.experienceEntries?.map((e) => ({
      title: e.title,
      company: e.company,
      startDate: e.startDate,
      endDate: e.endDate,
      bullets: e.bullets,
    })),
    links: c.links,
    cv_url: c.cvUrl || undefined,
    last_active: c.lastActive,
  } as ExtendedSeeker;
}

const Profiles = () => {
  const [search, setSearch] = useState("");
  const [selectedSeeker, setSelectedSeeker] = useState<ExtendedSeeker | null>(null);
  const { candidates, loading } = useCandidates();

  const seekers = useMemo(() => candidates.map(candidateToSeeker), [candidates]);

  const filtered = useMemo(() => {
    if (!search.trim()) return seekers;
    const q = search.toLowerCase();
    return seekers.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.title.toLowerCase().includes(q) ||
        s.skills.some((sk: string) => sk.toLowerCase().includes(q)) ||
        s.location.toLowerCase().includes(q)
    );
  }, [search, seekers]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="px-6 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg btn-gradient flex items-center justify-center">
            <Briefcase className="w-4 h-4 text-primary-foreground" />
          </div>
          <h1 className="font-display text-xl font-bold text-foreground">JobSwipe</h1>
        </div>
        <Link
          to="/"
          className="px-4 py-2 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium hover:bg-muted transition-colors"
        >
          Przeglądaj oferty
        </Link>
      </header>

      <main className="flex-1 flex flex-col px-4 py-6 max-w-lg mx-auto w-full">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h2 className="font-display text-2xl font-bold text-foreground mb-1">
            Pula talentów
          </h2>
          <p className="text-muted-foreground text-sm mb-5">
            Przeglądaj kandydatów wg umiejętności, roli lub lokalizacji. Kliknij, aby zobaczyć pełny profil.
          </p>

          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Szukaj po imieniu, umiejętności lub roli…"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-secondary border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </motion.div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-sm">Ładowanie profili...</p>
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-muted-foreground text-sm py-12">
            Brak profili pasujących do wyszukiwania.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {filtered.map((seeker, i) => (
              <SeekerCard
                key={seeker.id}
                seeker={seeker}
                index={i}
                onClick={() => setSelectedSeeker(seeker)}
              />
            ))}
          </div>
        )}
      </main>

      <CandidateProfileModal
        seeker={selectedSeeker}
        onClose={() => setSelectedSeeker(null)}
      />
    </div>
  );
};

export default Profiles;
