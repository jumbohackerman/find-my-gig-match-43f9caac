import { Link } from "react-router-dom";
import { Briefcase, Building2, Users, User, LogOut, Bell, Search } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";

const Navbar = () => {
  const { user, profile, signOut } = useAuth();
  const { notifications, unreadCount, markAllRead } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const isCandidate = profile?.role === "candidate";
  const isEmployer = profile?.role === "employer";
  const isGuest = !user;

  // Close notifications on Escape or outside click
  useEffect(() => {
    if (!showNotifications) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowNotifications(false);
    };
    const handleClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("keydown", handleKey);
    document.addEventListener("mousedown", handleClick);
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.removeEventListener("mousedown", handleClick);
    };
  }, [showNotifications]);

  return (
    <header className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border flex items-center justify-between gap-2" role="banner">
      <nav aria-label="Nawigacja główna" className="flex items-center gap-1.5 sm:gap-2 flex-wrap justify-end w-full">
        {/* Logo */}
        <Link to={isGuest ? "/auth" : "/"} className="flex items-center gap-2 shrink-0 mr-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg" aria-label="JobSwipe — strona główna">
          <div className="w-8 h-8 rounded-lg btn-gradient flex items-center justify-center" aria-hidden="true">
            <Briefcase className="w-4 h-4 text-primary-foreground" />
          </div>
          <h1 className="font-display text-xl font-bold text-foreground">JobSwipe</h1>
        </Link>

        {/* ── Guest CTAs ── */}
        {isGuest && (
          <>
            <Link
              to="/auth"
              className="p-2 sm:px-4 sm:py-2 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium hover:bg-muted transition-colors flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Przeglądaj oferty"
            >
              <Search className="w-4 h-4" aria-hidden="true" />
              <span className="hidden sm:inline">Przeglądaj oferty</span>
            </Link>
            <Link
              to="/auth"
              state={{ defaultRole: "employer" }}
              className="p-2 sm:px-4 sm:py-2 rounded-xl btn-gradient text-primary-foreground text-sm font-medium shadow-glow hover:scale-[1.02] transition-transform flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Dla firm"
            >
              <Building2 className="w-4 h-4" aria-hidden="true" />
              <span className="hidden sm:inline">Dla firm</span>
            </Link>
          </>
        )}

        {/* ── Candidate CTAs ── */}
        {isCandidate && (
          <>
            <Link
              to="/my-profile"
              className="p-2 sm:px-4 sm:py-2 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium hover:bg-muted transition-colors flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Mój profil"
            >
              <User className="w-4 h-4" aria-hidden="true" />
              <span className="hidden sm:inline">Mój profil</span>
            </Link>
            <Link
              to="/auth"
              state={{ defaultRole: "employer" }}
              className="p-2 sm:px-4 sm:py-2 rounded-xl btn-gradient text-primary-foreground text-sm font-medium shadow-glow hover:scale-[1.02] transition-transform flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Dla firm"
            >
              <Building2 className="w-4 h-4" aria-hidden="true" />
              <span className="hidden sm:inline">Dla firm</span>
            </Link>
          </>
        )}

        {/* ── Employer CTAs ── */}
        {isEmployer && (
          <>
            <Link
              to="/employer"
              className="p-2 sm:px-4 sm:py-2 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium hover:bg-muted transition-colors flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Panel pracodawcy"
            >
              <Building2 className="w-4 h-4" aria-hidden="true" />
              <span className="hidden sm:inline">Panel pracodawcy</span>
            </Link>
            <Link
              to="/profiles"
              className="p-2 sm:px-4 sm:py-2 rounded-xl btn-gradient text-primary-foreground text-sm font-medium shadow-glow hover:scale-[1.02] transition-transform flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Znajdź talent"
            >
              <Users className="w-4 h-4" aria-hidden="true" />
              <span className="hidden sm:inline">Znajdź talent</span>
            </Link>
          </>
        )}

        {/* ── Notifications (authenticated only) ── */}
        {user && (
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                markAllRead();
              }}
              className="p-2 rounded-xl bg-secondary text-secondary-foreground hover:bg-muted transition-colors relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={`Powiadomienia${unreadCount > 0 ? ` (${unreadCount} nieprzeczytanych)` : ""}`}
              aria-expanded={showNotifications}
              aria-haspopup="true"
            >
              <Bell className="w-4 h-4" aria-hidden="true" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-accent text-accent-foreground text-[9px] font-bold flex items-center justify-center" aria-hidden="true">
                  {unreadCount}
                </span>
              )}
            </button>

            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="absolute right-0 top-12 w-72 card-gradient rounded-xl border border-border shadow-lg z-50 overflow-hidden"
                  role="region"
                  aria-label="Panel powiadomień"
                >
                  <div className="p-3 border-b border-border">
                    <p className="text-xs font-semibold text-foreground">Powiadomienia</p>
                  </div>
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-xs text-muted-foreground">
                      Brak powiadomień
                    </div>
                  ) : (
                    <div className="max-h-60 overflow-y-auto" role="list">
                      {notifications.map((n) => (
                        <div
                          key={n.id}
                          role="listitem"
                          className={`p-3 border-b border-border last:border-0 ${n.read ? "" : "bg-accent/5"}`}
                        >
                          <p className="text-xs font-medium text-foreground">{n.title}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{n.body}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* ── Logout ── */}
        {user && (
          <button
            onClick={signOut}
            className="p-2 rounded-xl bg-secondary text-secondary-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Wyloguj się"
          >
            <LogOut className="w-4 h-4" aria-hidden="true" />
          </button>
        )}
      </nav>
    </header>
  );
};

export default Navbar;
