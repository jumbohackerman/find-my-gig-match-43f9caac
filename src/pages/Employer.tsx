import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Briefcase, Plus, Users, Trash2, Eye, ChevronDown, ChevronUp } from "lucide-react";
import { jobs as initialJobs, type Job } from "@/data/jobs";
import { seekers } from "@/data/seekers";

// Simulate some applicants per job
const generateApplicants = () => {
  const map: Record<string, typeof seekers> = {};
  initialJobs.forEach((job) => {
    const count = Math.floor(Math.random() * 4);
    const shuffled = [...seekers].sort(() => 0.5 - Math.random());
    map[job.id] = shuffled.slice(0, count);
  });
  return map;
};

const Employer = () => {
  const [postedJobs, setPostedJobs] = useState<Job[]>(initialJobs);
  const [applicants] = useState(generateApplicants);
  const [expandedJob, setExpandedJob] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    title: "",
    company: "",
    logo: "🏢",
    location: "",
    salary: "",
    type: "Full-time" as Job["type"],
    description: "",
    tags: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newJob: Job = {
      id: String(Date.now()),
      title: form.title,
      company: form.company,
      logo: form.logo,
      location: form.location,
      salary: form.salary,
      type: form.type,
      description: form.description,
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      posted: "Just now",
    };
    setPostedJobs((prev) => [newJob, ...prev]);
    setForm({ title: "", company: "", logo: "🏢", location: "", salary: "", type: "Full-time", description: "", tags: "" });
    setShowForm(false);
  };

  const handleDelete = (id: string) => {
    setPostedJobs((prev) => prev.filter((j) => j.id !== id));
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="px-6 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg btn-gradient flex items-center justify-center">
            <Briefcase className="w-4 h-4 text-primary-foreground" />
          </div>
          <h1 className="font-display text-xl font-bold text-foreground">JobSwipe</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/"
            className="px-4 py-2 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium hover:bg-muted transition-colors"
          >
            Browse Jobs
          </Link>
          <Link
            to="/profiles"
            className="px-4 py-2 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium hover:bg-muted transition-colors flex items-center gap-1.5"
          >
            <Users className="w-4 h-4" />
            Talent
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col px-4 py-6 max-w-2xl mx-auto w-full">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-display text-2xl font-bold text-foreground">Employer Dashboard</h2>
              <p className="text-muted-foreground text-sm mt-1">
                Manage your listings and view applicants.
              </p>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl btn-gradient text-primary-foreground text-sm font-medium shadow-glow hover:scale-105 transition-transform"
            >
              <Plus className="w-4 h-4" />
              Post Job
            </button>
          </div>
        </motion.div>

        {/* Post Job Form */}
        <AnimatePresence>
          {showForm && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
              onSubmit={handleSubmit}
            >
              <div className="card-gradient rounded-2xl border border-border p-5 mb-6 space-y-4">
                <h3 className="font-display text-lg font-semibold text-foreground">New Job Listing</h3>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground font-medium">Job Title *</label>
                    <input
                      required
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      placeholder="e.g. Frontend Developer"
                      className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground font-medium">Company *</label>
                    <input
                      required
                      value={form.company}
                      onChange={(e) => setForm({ ...form, company: e.target.value })}
                      placeholder="e.g. Acme Corp"
                      className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground font-medium">Location *</label>
                    <input
                      required
                      value={form.location}
                      onChange={(e) => setForm({ ...form, location: e.target.value })}
                      placeholder="e.g. Remote"
                      className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground font-medium">Salary</label>
                    <input
                      value={form.salary}
                      onChange={(e) => setForm({ ...form, salary: e.target.value })}
                      placeholder="e.g. $120k - $150k"
                      className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground font-medium">Type</label>
                    <select
                      value={form.type}
                      onChange={(e) => setForm({ ...form, type: e.target.value as Job["type"] })}
                      className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="Full-time">Full-time</option>
                      <option value="Part-time">Part-time</option>
                      <option value="Contract">Contract</option>
                      <option value="Remote">Remote</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground font-medium">Emoji Logo</label>
                    <input
                      value={form.logo}
                      onChange={(e) => setForm({ ...form, logo: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground font-medium">Tags (comma-separated)</label>
                    <input
                      value={form.tags}
                      onChange={(e) => setForm({ ...form, tags: e.target.value })}
                      placeholder="React, TypeScript"
                      className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground font-medium">Description *</label>
                  <textarea
                    required
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Describe the role…"
                    rows={3}
                    className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                  />
                </div>

                <div className="flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-4 py-2 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium hover:bg-muted transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl btn-gradient text-primary-foreground text-sm font-medium shadow-glow hover:scale-105 transition-transform"
                  >
                    Publish Listing
                  </button>
                </div>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Job Listings */}
        <div className="space-y-3">
          <AnimatePresence>
            {postedJobs.map((job, i) => {
              const jobApplicants = applicants[job.id] || [];
              const isExpanded = expandedJob === job.id;

              return (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ delay: i * 0.03 }}
                  className="card-gradient rounded-xl border border-border overflow-hidden"
                >
                  <div className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-xl shrink-0">
                      {job.logo}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-display text-sm font-semibold text-foreground truncate">{job.title}</h4>
                      <p className="text-xs text-muted-foreground">{job.company} · {job.location} · {job.posted}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => setExpandedJob(isExpanded ? null : job.id)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground text-xs font-medium hover:bg-muted transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        {jobApplicants.length}
                        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                      <button
                        onClick={() => handleDelete(job.id)}
                        className="p-1.5 rounded-lg hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 border-t border-border pt-3">
                          <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                            Applicants ({jobApplicants.length})
                          </h5>
                          {jobApplicants.length === 0 ? (
                            <p className="text-xs text-muted-foreground">No applicants yet.</p>
                          ) : (
                            <div className="space-y-2">
                              {jobApplicants.map((seeker) => (
                                <div
                                  key={seeker.id}
                                  className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50"
                                >
                                  <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-sm">
                                    {seeker.avatar}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-foreground">{seeker.name}</p>
                                    <p className="text-xs text-muted-foreground">{seeker.title} · {seeker.experience}</p>
                                  </div>
                                  <div className="flex gap-1 flex-wrap justify-end">
                                    {seeker.skills.slice(0, 2).map((skill) => (
                                      <span
                                        key={skill}
                                        className="text-[10px] px-2 py-0.5 rounded-full bg-accent/10 text-accent font-medium"
                                      >
                                        {skill}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

export default Employer;
