import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Briefcase, Mail, Lock, User, ArrowRight, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Mode = "login" | "signup" | "forgot";
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
      if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast.success("Sprawdź email — wysłaliśmy link do resetowania hasła!");
        setMode("login");
      } else if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { role, full_name: fullName },
          },
        });
        if (error) throw error;

        if (data.session) {
          navigate("/");
        } else {
          toast.success("Sprawdź email, aby potwierdzić konto!");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate("/");
      }
    } catch (err: any) {
      toast.error(err.message || "Coś poszło nie tak");
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
            {mode === "login" ? "Witaj ponownie" : mode === "signup" ? "Utwórz konto" : "Resetuj hasło"}
          </h2>
          <p className="text-muted-foreground text-sm mb-5">
            {mode === "login"
              ? "Zaloguj się, aby kontynuować przeglądanie."
              : mode === "signup"
              ? "Dołącz jako kandydat lub pracodawca."
              : "Podaj email, aby otrzymać link do resetowania."}
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
                      {r === "candidate" ? "🧑‍💻 Kandydat" : "🏢 Pracodawca"}
                    </button>
                  ))}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground font-medium">Imię i nazwisko</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Twoje imię i nazwisko"
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
                  placeholder="ty@przyklad.pl"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-secondary border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            {mode !== "forgot" && (
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground font-medium">Hasło</label>
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
            )}

            {mode === "login" && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setMode("forgot")}
                  className="text-xs text-muted-foreground hover:text-primary transition-colors"
                >
                  Zapomniałeś hasła?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl btn-gradient text-primary-foreground text-sm font-medium shadow-glow hover:scale-[1.02] transition-transform disabled:opacity-50"
            >
              {loading
                ? "Ładowanie…"
                : mode === "login"
                ? "Zaloguj się"
                : mode === "signup"
                ? "Utwórz konto"
                : "Wyślij link resetowania"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-4">
            {mode === "forgot" ? (
              <button
                onClick={() => setMode("login")}
                className="text-primary font-medium hover:underline inline-flex items-center gap-1"
              >
                <ArrowLeft className="w-3 h-3" /> Wróć do logowania
              </button>
            ) : (
              <>
                {mode === "login" ? "Nie masz konta?" : "Masz już konto?"}{" "}
                <button
                  onClick={() => setMode(mode === "login" ? "signup" : "login")}
                  className="text-primary font-medium hover:underline"
                >
                  {mode === "login" ? "Zarejestruj się" : "Zaloguj się"}
                </button>
              </>
            )}
          </p>
        </div>

        <button
          onClick={() => navigate("/")}
          className="mt-4 w-full py-2.5 rounded-xl border border-dashed border-border text-muted-foreground text-sm font-medium hover:bg-secondary transition-colors"
        >
          🚀 Demo — pomiń logowanie
        </button>
      </motion.div>
    </div>
  );
};

export default Auth;
