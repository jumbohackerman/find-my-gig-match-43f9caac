import { Compass, ClipboardList, Star, User } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import type { LucideIcon } from "lucide-react";

type TabKey = "swipe" | "applied" | "saved" | "profile";

interface Props {
  activeTab: string;
  onChangeTab: (tab: string) => void;
  appliedCount?: number;
  savedCount?: number;
}

interface TabDef {
  key: TabKey;
  label: string;
  icon: LucideIcon;
  route?: string;
}

const tabs: TabDef[] = [
  { key: "swipe", label: "Przeglądaj", icon: Compass },
  { key: "applied", label: "Aplikacje", icon: ClipboardList },
  { key: "saved", label: "Zapisane", icon: Star },
  { key: "profile", label: "Profil", icon: User, route: "/my-profile" },
];

const MobileBottomNav = ({ activeTab, onChangeTab, appliedCount = 0, savedCount = 0 }: Props) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isProfile = location.pathname === "/my-profile";

  const handleTap = (tab: TabDef) => {
    if (tab.route) {
      navigate(tab.route);
      return;
    }
    if (location.pathname !== "/") navigate("/");
    onChangeTab(tab.key);
  };

  const getCount = (key: TabKey) => {
    if (key === "applied") return appliedCount;
    if (key === "saved") return savedCount;
    return 0;
  };

  return (
    <nav
      className="sm:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-border/60 glass-surface safe-bottom"
      aria-label="Nawigacja mobilna"
      data-testid="mobile-bottom-nav"
    >
      <ul className="flex items-stretch">
        {tabs.map((tab) => {
          const isActive = tab.route ? isProfile : !isProfile && activeTab === tab.key;
          const count = getCount(tab.key);
          const Icon = tab.icon;
          return (
            <li key={tab.key} className="flex-1">
              <button
                type="button"
                onClick={() => handleTap(tab)}
                className={`w-full flex flex-col items-center justify-center py-2 pt-2.5 gap-0.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md ${
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
                aria-label={tab.label}
                aria-current={isActive ? "page" : undefined}
                data-testid={`mobile-tab-${tab.key}`}
              >
                <span className="relative">
                  <Icon className="w-5 h-5" aria-hidden="true" />
                  {count > 0 && (
                    <span
                      className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center"
                      aria-hidden="true"
                    >
                      {count > 99 ? "99" : count}
                    </span>
                  )}
                </span>
                <span className="text-[10px] font-medium leading-none">{tab.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default MobileBottomNav;
