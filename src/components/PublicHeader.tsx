import { Link, useNavigate } from "react-router-dom";
import logo from "@/assets/jobswipe-logo.png";

export type PublicHeaderRole = "candidate" | "employer";

interface PublicHeaderProps {
  role: PublicHeaderRole;
  /**
   * Wywoływane TYLKO w trybie "landing" — przełącza widok na tej samej stronie.
   * W trybie "auth" jest ignorowane (klik przenosi na /?view=...).
   */
  onRoleChange?: (role: PublicHeaderRole) => void;
  /**
   * - "landing": przyciski przełączają widok na tej samej stronie (callback).
   *              Prawy przycisk → /auth?role={role}
   * - "auth":    przyciski to nawigacja do /?view=candidate | /?view=employer.
   *              Prawy przycisk → /?view=candidate (Strona główna)
   */
  variant?: "landing" | "auth";
}

/**
 * Wspólny publiczny nagłówek (Landing, Auth, ResetPassword).
 * Logo zawsze prowadzi na /?view=candidate.
 */
const PublicHeader = ({ role, onRoleChange, variant = "landing" }: PublicHeaderProps) => {
  const navigate = useNavigate();

  const handleRoleClick = (r: PublicHeaderRole) => {
    if (variant === "landing") {
      onRoleChange?.(r);
    } else {
      navigate(`/?view=${r}`);
    }
  };

  const tabClass = (active: boolean) =>
    `px-3 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 ${
      active
        ? "bg-orange-500 text-white shadow-[0_0_20px_rgba(249,115,22,0.3)]"
        : "text-muted-foreground hover:text-foreground"
    }`;

  return (
    <header className="px-4 sm:px-6 py-4 border-b border-border sticky top-0 z-40 bg-background/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto flex items-center gap-3 sm:gap-6">
        <Link
          to="/?view=candidate"
          className="flex items-center gap-2.5 shrink-0"
          aria-label="JobSwipe — strona główna"
        >
          <img src={logo} alt="" className="w-9 h-9" />
          <span className="font-display text-xl font-bold hidden sm:inline">
            Job<span className="text-gradient-primary">Swipe</span>
          </span>
        </Link>

        <div className="flex-1 flex justify-center">
          <div
            role="tablist"
            aria-label="Wybierz widok"
            className="inline-flex gap-1 p-1 rounded-full bg-secondary/50 border border-border"
          >
            <button
              type="button"
              role="tab"
              aria-selected={role === "candidate"}
              onClick={() => handleRoleClick("candidate")}
              className={tabClass(role === "candidate")}
            >
              Dla kandydata
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={role === "employer"}
              onClick={() => handleRoleClick("employer")}
              className={tabClass(role === "employer")}
            >
              Dla pracodawcy
            </button>
          </div>
        </div>

        {variant === "landing" ? (
          <Link
            to={`/auth?role=${role}`}
            className="px-3 sm:px-4 py-2 rounded-xl bg-secondary/50 border border-border text-foreground text-sm font-medium hover:bg-secondary transition-colors shrink-0"
          >
            Zaloguj się
          </Link>
        ) : (
          <Link
            to="/?view=candidate"
            className="px-3 sm:px-4 py-2 rounded-xl bg-secondary/50 border border-border text-foreground text-sm font-medium hover:bg-secondary transition-colors shrink-0"
          >
            Strona główna
          </Link>
        )}
      </div>
    </header>
  );
};

export default PublicHeader;
