import { Link, useNavigate } from "react-router-dom";
import { Building2, User, LogOut, Bell, MessageSquare, Sparkles, Mail, CheckCircle, XCircle, Lock, Bell as BellIcon, Sun, Moon } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { timeAgo } from "@/lib/timeAgo";
import logo from "@/assets/jobswipe-logo.png";
import { AnimatePresence, motion } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";
import type { NotificationType } from "@/domain/models";
import EmployerProfileModal from "@/components/employer/EmployerProfileModal";
import { toast } from "sonner";

function notificationIcon(type: NotificationType) {
  switch (type) {
    case "shortlisted": return Sparkles;
    case "contact_invitation": return Mail;
    case "invitation_accepted": return CheckCircle;
    case "invitation_rejected": return XCircle;
    case "position_closed": return Lock;
    case "new_message": return MessageSquare;
    case "interview_scheduled": return Bell;
    case "hired": return CheckCircle;
    default: return BellIcon;
  }
}

function notificationTarget(
  type: NotificationType,
  role: string | undefined,
  refId: string | undefined,
): string | null {
  if (role === "employer") return "/employer";
  // candidate
  switch (type) {
    case "contact_invitation":
    case "invitation_accepted":
    case "invitation_rejected":
    case "shortlisted":
    case "status_change":
    case "position_closed":
    case "new_message":
    case "interview_scheduled":
    case "hired":
      return "/my-profile";
    default:
      return refId ? `/my-profile` : "/my-profile";
  }
}

const Navbar = () => {
  const { user, profile, signOut } = useAuth();
  const { notifications, unreadCount, markAllRead, markRead } = useNotifications();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showEmployerProfile, setShowEmployerProfile] = useState(false);
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
    <header className="sticky top-0 z-40 border-b border-border/60 glass-surface px-4 sm:px-6 py-3 sm:py-4" role="banner" data-testid="navbar">
      <div className="browse-shell">
        <nav aria-label="Nawigacja główna" className="flex items-center gap-1.5 sm:gap-2 flex-wrap justify-end w-full">
          {/* Logo */}
          <Link to={isGuest ? "/auth" : "/"} className="group flex items-center gap-2.5 shrink-0 mr-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg" aria-label="JobSwipe — strona główna" data-testid="nav-logo">
            <div className="w-9 h-9 flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300" aria-hidden="true">
              <img src={logo} alt="" className="w-full h-full object-contain" />
            </div>
            <h1 className="font-display text-xl font-bold text-foreground tracking-tight">
              Job<span className="text-gradient-primary">Swipe</span>
            </h1>
          </Link>

          {/* ── Theme toggle ── */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "Włącz jasny motyw" : "Włącz ciemny motyw"}
            title={theme === "dark" ? "Jasny motyw" : "Ciemny motyw"}
            className="p-2 rounded-xl bg-secondary text-secondary-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            data-testid="nav-theme-toggle"
          >
            {theme === "dark" ? <Sun className="w-4 h-4" aria-hidden="true" /> : <Moon className="w-4 h-4" aria-hidden="true" />}
          </button>

          {/* ── Guest CTA ── */}
          {isGuest && (
            <Link
              to="/auth"
              className="px-4 py-2 rounded-xl btn-gradient text-primary-foreground text-sm font-medium shadow-glow hover:scale-[1.02] transition-transform flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Zaloguj się"
              data-testid="nav-login"
            >
              <User className="w-4 h-4" aria-hidden="true" />
              <span>Zaloguj się</span>
            </Link>
          )}

          {/* ── Candidate CTAs ── */}
          {isCandidate && (
            <Link
              to="/my-profile"
              className="p-2 sm:px-4 sm:py-2 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium hover:bg-muted transition-colors flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Mój profil"
              data-testid="nav-profile"
            >
              <User className="w-4 h-4" aria-hidden="true" />
              <span className="hidden sm:inline">Mój profil</span>
            </Link>
          )}

          {/* ── Employer CTAs ── */}
          {isEmployer && (
            <Link
              to="/employer"
              className="p-2 sm:px-4 sm:py-2 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium hover:bg-muted transition-colors flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Panel pracodawcy"
            >
              <Building2 className="w-4 h-4" aria-hidden="true" />
              <span className="hidden sm:inline">Panel pracodawcy</span>
            </Link>
          )}
          {isEmployer && (
            <button
              type="button"
              onClick={() => setShowEmployerProfile(true)}
              className="p-2 sm:px-4 sm:py-2 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium hover:bg-muted transition-colors flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Profil firmy"
              data-testid="nav-employer-profile"
            >
              <User className="w-4 h-4" aria-hidden="true" />
              <span className="hidden sm:inline">Profil firmy</span>
            </button>
          )}

          {/* ── Notifications (authenticated only) ── */}
          {user && (
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setShowNotifications((v) => !v)}
                className="p-2 rounded-xl bg-secondary text-secondary-foreground hover:bg-muted transition-colors relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                data-testid="nav-notifications"
                aria-label={`Powiadomienia${unreadCount > 0 ? ` (${unreadCount} nieprzeczytanych)` : ""}`}
                aria-expanded={showNotifications}
                aria-haspopup="true"
              >
                <Bell className="w-4 h-4" aria-hidden="true" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center" aria-hidden="true">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="absolute right-0 top-12 w-80 card-gradient rounded-xl border border-border shadow-lg z-50 overflow-hidden"
                    role="region"
                    aria-label="Panel powiadomień"
                  >
                    <div className="p-3 border-b border-border flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-foreground">Powiadomienia</p>
                      {unreadCount > 0 && (
                        <button
                          onClick={() => markAllRead()}
                          className="text-[10px] text-accent hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded"
                        >
                          Oznacz wszystkie jako przeczytane
                        </button>
                      )}
                    </div>
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-xs text-muted-foreground">
                        Brak powiadomień
                      </div>
                    ) : (
                      <div className="max-h-80 overflow-y-auto" role="list">
                        {notifications.map((n) => {
                          const Icon = notificationIcon(n.type);
                          const target = notificationTarget(n.type, profile?.role, n.referenceId);
                          return (
                            <button
                              key={n.id}
                              type="button"
                              role="listitem"
                              onClick={async () => {
                                if (!n.read) await markRead(n.id);
                                setShowNotifications(false);
                                if (target) navigate(target);
                              }}
                              className={`w-full text-left p-3 border-b border-border last:border-0 hover:bg-secondary/50 transition-colors flex gap-3 ${n.read ? "" : "bg-accent/5"}`}
                            >
                              <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                                <Icon className="w-4 h-4 text-foreground" aria-hidden="true" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-2">
                                  <p className="text-xs font-medium text-foreground truncate">{n.title}</p>
                                  {!n.read && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" aria-label="Nieprzeczytane" />
                                  )}
                                </div>
                                <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>
                                {n.createdAt && (
                                  <p className="text-[9px] text-muted-foreground/60 mt-1">{timeAgo(n.createdAt)}</p>
                                )}
                              </div>
                            </button>
                          );
                        })}
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
              data-testid="nav-logout"
            >
              <LogOut className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
        </nav>
      </div>
      <EmployerProfileModal open={showEmployerProfile} onClose={() => setShowEmployerProfile(false)} />
    </header>
  );
};

export default Navbar;
