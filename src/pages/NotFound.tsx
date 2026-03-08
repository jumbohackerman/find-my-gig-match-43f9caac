import { Link, useLocation } from "react-router-dom";
import { Briefcase, ArrowLeft, Search } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Navbar-style header */}
      <header className="px-6 py-4 border-b border-border flex items-center gap-2">
        <Link to="/" className="flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg" aria-label="JobSwipe — strona główna">
          <div className="w-8 h-8 rounded-lg btn-gradient flex items-center justify-center" aria-hidden="true">
            <Briefcase className="w-4 h-4 text-primary-foreground" />
          </div>
          <h1 className="font-display text-xl font-bold text-foreground">JobSwipe</h1>
        </Link>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 text-center">
        <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mx-auto mb-6 text-4xl">
          🔍
        </div>
        <h2 className="font-display text-3xl font-bold text-foreground mb-2">404</h2>
        <p className="text-lg text-muted-foreground mb-1">Nie znaleziono strony</p>
        <p className="text-sm text-muted-foreground mb-8 max-w-sm">
          Strona <code className="px-1.5 py-0.5 rounded bg-secondary text-foreground text-xs">{location.pathname}</code> nie istnieje lub została przeniesiona.
        </p>
        <div className="flex gap-3 flex-wrap justify-center">
          <Link
            to="/"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl btn-gradient text-primary-foreground text-sm font-medium shadow-glow hover:scale-105 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Search className="w-4 h-4" aria-hidden="true" /> Przeglądaj oferty
          </Link>
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" /> Wróć
          </button>
        </div>
      </main>

      <footer className="border-t border-border px-6 py-3 shrink-0">
        <div className="max-w-md mx-auto flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <Link to="/privacy" className="hover:text-foreground transition-colors">Polityka Prywatności</Link>
          <span className="text-border">·</span>
          <Link to="/terms" className="hover:text-foreground transition-colors">Regulamin</Link>
        </div>
      </footer>
    </div>
  );
};

export default NotFound;
