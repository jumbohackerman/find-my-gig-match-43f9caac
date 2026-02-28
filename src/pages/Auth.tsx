import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Briefcase, Mail, Lock, User, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Mode = "login" | "signup";
type Role = "candidate" | "employer";

const Auth = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("login");
  const [role, setRole] = useState<Role>("candidate");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { role, full_name: fullName },
          },
        });
        if (error) throw error;

        // If session exists, user is auto-confirmed — navigate directly
        if (data.session) {
          navigate("/");
        } else {
          toast.success("Check your email to confirm your account!");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate("/");
      }
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="flex items-center gap-2 justify-center mb-8">
          <div className="w-10 h-10 rounded-xl btn-gradient flex items-center justify-center">
            <Briefcase className="w-5 h-5 text-primary-foreground" />
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground">JobSwipe</h1>
        </div>

        <div className="card-gradient rounded-2xl border border-border p-6">
          <h2 className="font-display text-lg font-bold text-foreground mb-1">
            {mode === "login" ? "Welcome back" : "Create account"}
          </h2>
          <p className="text-muted-foreground text-sm mb-5">
            {mode === "login"
              ? "Sign in to continue swiping."
              : "Join as a candidate or employer."}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <>
                {/* Role selector */}
                <div className="grid grid-cols-2 gap-2">
                  {(["candidate", "employer"] as Role[]).map((r) => (
                    <button
                      type="button"
                      key={r}
                      onClick={() => setRole(r)}
                      className={`py-2.5 rounded-xl text-sm font-medium transition-all ${
                        role === r
                          ? "btn-gradient text-primary-foreground shadow-glow"
                          : "bg-secondary text-secondary-foreground hover:bg-muted"
                      }`}
                    >
                      {r === "candidate" ? "🧑‍💻 Candidate" : "🏢 Employer"}
                    </button>
                  ))}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground font-medium">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Your name"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-secondary border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>
              </>
            )}

            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground font-medium">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-secondary border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground font-medium">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  required
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  minLength={6}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-secondary border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl btn-gradient text-primary-foreground text-sm font-medium shadow-glow hover:scale-[1.02] transition-transform disabled:opacity-50"
            >
              {loading ? "Loading…" : mode === "login" ? "Sign In" : "Create Account"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-4">
            {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              onClick={() => setMode(mode === "login" ? "signup" : "login")}
              className="text-primary font-medium hover:underline"
            >
              {mode === "login" ? "Sign up" : "Sign in"}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;
