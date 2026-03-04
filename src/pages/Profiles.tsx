import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Briefcase, Search } from "lucide-react";
import { motion } from "framer-motion";
import SeekerCard from "@/components/SeekerCard";
import CandidateProfileModal from "@/components/CandidateProfileModal";
import type { ExtendedSeeker } from "@/components/CandidateProfileModal";
import { seekers } from "@/data/seekers";

const Profiles = () => {
  const [search, setSearch] = useState("");
  const [selectedSeeker, setSelectedSeeker] = useState<ExtendedSeeker | null>(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return seekers;
    const q = search.toLowerCase();
    return seekers.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.title.toLowerCase().includes(q) ||
        s.skills.some((sk) => sk.toLowerCase().includes(q)) ||
        s.location.toLowerCase().includes(q)
    );
  }, [search]);

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
          Browse Jobs
        </Link>
      </header>

      <main className="flex-1 flex flex-col px-4 py-6 max-w-lg mx-auto w-full">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h2 className="font-display text-2xl font-bold text-foreground mb-1">
            Talent Pool
          </h2>
          <p className="text-muted-foreground text-sm mb-5">
            Browse job seekers by skills, role, or location. Click to see full profile.
          </p>

          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, skill, or role…"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-secondary border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </motion.div>

        {filtered.length === 0 ? (
          <p className="text-center text-muted-foreground text-sm py-12">
            No profiles match your search.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {filtered.map((seeker, i) => (
              <SeekerCard
                key={seeker.id}
                seeker={seeker}
                index={i}
                onClick={() => setSelectedSeeker(seeker as ExtendedSeeker)}
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
