import { Link } from "react-router-dom";
import logo from "@/assets/jobswipe-logo.png";

export type PublicHeaderRole = "candidate" | "employer";

interface PublicHeaderProps {
  role: PublicHeaderRole;
  onRoleChange: (role: PublicHeaderRole) => void;
  /**
   * - "landing": prawy przycisk → /auth?role={role}
   * - "auth":    prawy przycisk → / (Strona główna)
   */
  variant?: "landing" | "auth";
}

/**
 * Wspólny publiczny nagłówek (Landing, Auth, ResetPassword).
 * Logo zawsze prowadzi na "/" (widok kandydata).
 */
const PublicHeader = ({ role, onRoleChange, variant = "landing" }: PublicHeaderProps) => {
  return (
    <header className="px-4 sm:px-6 py-4 border-b border-border sticky top-0 z-40 bg-background/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto flex items-center gap-3 sm:gap-6">
        <Link
          to="/"
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
              onClick={() => onRoleChange("candidate")}
              className={`px-3 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 ${
                role === "candidate"
                  ? "bg-orange-500 text-white shadow-[0_0_20px_rgba(249,115,22,0.3)]"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Dla kandydata
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={role === "employer"}
              onClick={() => onRoleChange("employer")}
              className={`px-3 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 ${
                role === "employer"
                  ? "bg-orange-500 text-white shadow-[0_0_20px_rgba(249,115,22,0.3)]"
                  : "text-muted-foreground hover:text-foreground"
              }`}
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
            to="/"
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
