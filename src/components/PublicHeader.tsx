import { Link, useNavigate } from "react-router-dom";
import logo from "@/assets/jobswipe-logo.png";

export type PublicHeaderRole = "candidate" | "employer";

interface PublicHeaderProps {
  /** Currently selected role (controls toggle highlight). */
  role: PublicHeaderRole;
  /** Called when user picks a role from the toggle. */
  onRoleChange: (role: PublicHeaderRole) => void;
  /**
   * Variant controls the right-hand contextual button.
   * - "landing": shows "Zaloguj się" → /auth?role={role}
   * - "auth": shows "Strona główna" → /
   */
  variant?: "landing" | "auth";
}

/**
 * Shared public header used on Landing, Auth and ResetPassword pages.
 * Logo + name always navigate to the candidate landing view (/).
 */
const PublicHeader = ({ role, onRoleChange, variant = "landing" }: PublicHeaderProps) => {
  const navigate = useNavigate();

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    // Always go to candidate landing view
    onRoleChange("candidate");
    navigate("/");
  };

  return (
    <header className="px-4 sm:px-6 py-4 border-b border-border sticky top-0 z-40 bg-background/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto flex items-center gap-3 sm:gap-6">
        <Link
          to="/"
          onClick={handleLogoClick}
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
