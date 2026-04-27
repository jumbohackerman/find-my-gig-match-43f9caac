import { useState, useEffect } from "react";

import { useNavigate, useLocation, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Lock, User, ArrowRight, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import logo from "@/assets/jobswipe-logo.png";

type Mode = "login" | "signup" | "forgot";
type Role = "candidate" | "employer";

const Auth = () => {
  const { user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect already-authenticated users to their home
  useEffect(() => {
    if (authLoading) return;
    if (user && profile) {
      navigate(profile.role === "employer" ? "/employer" : "/", { replace: true });
    }
  }, [user, profile, authLoading, navigate]);
  const searchParams = new URLSearchParams(location.search);
  const roleFromUrl = searchParams.get("role");
  const defaultRole = roleFromUrl || (location.state as any)?.defaultRole;
  const [mode, setMode] = useState<Mode>("login");
  const [role, setRole] = useState<Role>(defaultRole === "employer" ? "employer" : "candidate");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);

  // Determine where to send user after auth based on role
  const getPostAuthRedirect = (userRole?: string) => {
    return userRole === "employer" ? "/employer" : "/";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (mode === "signup" && password.length < 6) {
      toast.error("Hasło musi mieć co najmniej 6 znaków");
      setLoading(false);
      return;
    }
    if (mode === "signup" && !fullName.trim()) {
      toast.error("Podaj imię i nazwisko");
      setLoading(false);
      return;
    }

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
          navigate(getPostAuthRedirect(role));
        } else {
          toast.success("Sprawdź email, aby potwierdzić konto!");
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        // Fetch profile role to redirect correctly
        const { data: profileData } = await supabase
          .from("profiles")
          .select("role")
          .eq("user_id", data.user.id)
          .maybeSingle();
        navigate(getPostAuthRedirect(profileData?.role));
      }
    } catch (err: any) {
      toast.error(err.message || "Coś poszło nie tak");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <button
          type="button"
          onClick={() => navigate("/")}
          className="mb-5 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-secondary text-secondary-foreground text-xs font-medium hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Wróć do strony głównej"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Wróć do strony głównej
        </button>

        <div className="flex items-center gap-2 justify-center mb-5">
          <img src={logo} alt="" className="w-10 h-10 object-contain" />
          <h1 className="font-display text-2xl font-bold text-foreground">JobSwipe</h1>
        </div>

        {/* Role pill toggle (matches landing page style) */}
        <div className="mb-5 flex justify-center">
          <div className="inline-flex p-1 rounded-full bg-secondary border border-border">
            {(["candidate", "employer"] as Role[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  role === r
                    ? "btn-gradient text-primary-foreground shadow-glow"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                aria-pressed={role === r}
              >
                {r === "candidate" ? "Dla kandydata" : "Dla pracodawcy"}
              </button>
            ))}
          </div>
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

          {mode === "signup" && (
            <div className="mb-4 p-3 rounded-xl bg-primary/10 border border-primary/20">
              <p className="text-xs text-foreground leading-relaxed">
                {role === "candidate" ? (
                  <>
                    ✦ Jako kandydat: aplikujesz profilem jednym kliknięciem, widzisz scoring dopasowania, pobierasz darmowe CV, a nawet jeśli nie przejdziesz dalej — zawsze dostajesz feedback.
                  </>
                ) : (
                  <>
                    ✦ Jako pracodawca: publikujesz ofertę za darmo, zbierasz uporządkowane profile, uruchamiasz Shortlistę Top 5 jednym kliknięciem — odrzuceni kandydaci dostaną automatyczny feedback.
                  </>
                )}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" data-testid="auth-form" aria-label={mode === "login" ? "Formularz logowania" : mode === "signup" ? "Formularz rejestracji" : "Formularz resetowania hasła"}>
            {mode === "signup" && (
              <>
                {/* Role selector */}
                <div className="grid grid-cols-2 gap-2">
                  {(["candidate", "employer"] as Role[]).map((r) => (
                    <button
                      type="button"
                      key={r}
                      onClick={() => setRole(r)}
                      data-testid={`auth-role-${r}`}
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
                  <label htmlFor="auth-fullname" className="text-xs text-muted-foreground font-medium">Imię i nazwisko</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      id="auth-fullname"
                      required
                      data-testid="auth-fullname"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Twoje imię i nazwisko"
                      autoComplete="name"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-secondary border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>
              </>
            )}

            <div className="space-y-1.5">
              <label htmlFor="auth-email" className="text-xs text-muted-foreground font-medium">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  id="auth-email"
                  required
                  type="email"
                  data-testid="auth-email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
              placeholder="jan@przyklad.pl"
                  autoComplete="email"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-secondary border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            {mode !== "forgot" && (
              <div className="space-y-1.5">
                <label htmlFor="auth-password" className="text-xs text-muted-foreground font-medium">Hasło</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      id="auth-password"
                      required
                      type="password"
                      data-testid="auth-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min. 6 znaków"
                      minLength={6}
                      autoComplete={mode === "login" ? "current-password" : "new-password"}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-secondary border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                </div>
                {mode === "signup" && password.length > 0 && password.length < 6 && (
                  <p className="text-[11px] text-destructive mt-1">Hasło musi mieć co najmniej 6 znaków</p>
                )}
              </div>
            )}

            {mode === "login" && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setMode("forgot")}
                  className="text-xs text-muted-foreground hover:text-primary transition-colors"
                >
                  Nie pamiętasz hasła?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              data-testid="auth-submit"
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl btn-gradient text-primary-foreground text-sm font-medium shadow-glow hover:scale-[1.02] transition-transform disabled:opacity-50"
            >
              {loading
                ? "Proszę czekać…"
                : mode === "login"
                ? "Zaloguj się"
                : mode === "signup"
                ? "Utwórz konto"
                : "Wyślij link resetowania"}
              <ArrowRight className="w-4 h-4" />
            </button>

            {mode === "signup" && (
              <p className="text-[11px] text-muted-foreground text-center mt-2 leading-relaxed">
                Rejestrując się, akceptujesz{" "}
                <Link to="/terms" className="text-primary hover:underline">Regulamin</Link>
                {" "}oraz{" "}
                <Link to="/privacy" className="text-primary hover:underline">Politykę Prywatności</Link>.
              </p>
            )}
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
                  data-testid="auth-toggle-mode"
                >
                  {mode === "login" ? "Zarejestruj się" : "Zaloguj się"}
                </button>
              </>
            )}
          </p>
        </div>

      </motion.div>
      </div>


    </div>
  );
};

export default Auth;
