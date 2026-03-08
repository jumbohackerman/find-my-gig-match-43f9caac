import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Briefcase, Search, Users } from "lucide-react";
import { motion } from "framer-motion";
import { CardSkeleton, EmptyView } from "@/components/StateViews";
import SeekerCard from "@/components/SeekerCard";
import CandidateProfileModal from "@/components/CandidateProfileModal";
import { useCandidates } from "@/hooks/useCandidates";
import type { Candidate } from "@/domain/models";

const Profiles = () => {
  const [search, setSearch] = useState("");
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const { candidates, loading } = useCandidates();

  const filtered = useMemo(() => {
    if (!search.trim()) return candidates;
    const q = search.toLowerCase();
    return candidates.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        c.skills.some((sk) => sk.toLowerCase().includes(q)) ||
        c.location.toLowerCase().includes(q)
    );
  }, [search, candidates]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border flex items-center justify-between gap-2">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-lg btn-gradient flex items-center justify-center">
            <Briefcase className="w-4 h-4 text-primary-foreground" />
          </div>
          <h1 className="font-display text-xl font-bold text-foreground">JobSwipe</h1>
        </Link>
        <Link
          to="/"
          className="p-2 sm:px-4 sm:py-2 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium hover:bg-muted transition-colors"
        >
          <span className="hidden sm:inline">Przeglądaj oferty</span>
          <Briefcase className="w-4 h-4 sm:hidden" />
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
          <div className="flex flex-col gap-4">
            {[1, 2, 3].map((i) => <CardSkeleton key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyView
            icon={<Users className="w-6 h-6 text-muted-foreground" />}
            title={search.trim() ? "Brak wyników" : "Brak kandydatów"}
            description={search.trim() ? "Spróbuj zmienić kryteria wyszukiwania." : "Kandydaci pojawią się tutaj gdy zaaplikują na Twoje oferty."}
          />
        ) : (
          <div className="flex flex-col gap-4">
            {filtered.map((candidate, i) => (
              <SeekerCard
                key={candidate.id}
                candidate={candidate}
                index={i}
                onClick={() => setSelectedCandidate(candidate)}
              />
            ))}
          </div>
        )}
      </main>

      <CandidateProfileModal
        candidate={selectedCandidate}
        onClose={() => setSelectedCandidate(null)}
      />
    </div>
  );
};

export default Profiles;
