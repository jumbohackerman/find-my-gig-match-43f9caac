import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { logConsent } from "@/lib/consent";

const STORAGE_KEY = "jobswipe_cookie_consent";

const CookieBanner = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(STORAGE_KEY);
    if (!consent) setVisible(true);
  }, []);

  const accept = (value: "all" | "essential") => {
    localStorage.setItem(STORAGE_KEY, value);
    logConsent({ type: "cookies", level: value });
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="fixed bottom-0 inset-x-0 z-50 p-4 sm:p-6"
        >
          <div className="max-w-lg mx-auto card-gradient rounded-2xl border border-border shadow-card p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground mb-1">🍪 Pliki cookies</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Używamy plików cookies, aby zapewnić działanie serwisu i poprawić Twoje doświadczenie.
                  Szczegóły w{" "}
                  <Link to="/cookies" className="text-primary hover:underline">Polityce Cookies</Link>
                  {" "}i{" "}
                  <Link to="/privacy" className="text-primary hover:underline">Polityce Prywatności</Link>.
                </p>
              </div>
              <button
                onClick={() => accept("essential")}
                className="p-1 text-muted-foreground hover:text-foreground shrink-0"
                aria-label="Zamknij"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => accept("all")}
                className="flex-1 px-4 py-2 rounded-xl btn-gradient text-primary-foreground text-xs font-medium shadow-glow hover:scale-[1.02] transition-transform"
              >
                Akceptuję wszystkie
              </button>
              <button
                onClick={() => accept("essential")}
                className="flex-1 px-4 py-2 rounded-xl bg-secondary text-secondary-foreground text-xs font-medium hover:bg-muted transition-colors"
              >
                Tylko niezbędne
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CookieBanner;
