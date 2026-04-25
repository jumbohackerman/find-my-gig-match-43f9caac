import { Link } from "react-router-dom";

const Footer = () => (
  <footer className="border-t border-border px-4 sm:px-6 py-3 shrink-0">
    <div className="browse-shell">
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <Link to="/privacy" className="hover:text-foreground transition-colors">Prywatność</Link>
        <span className="text-border">·</span>
        <Link to="/terms" className="hover:text-foreground transition-colors">Regulamin</Link>
        <span className="text-border">·</span>
        <Link to="/cookies" className="hover:text-foreground transition-colors">Cookies</Link>
        <span className="text-border">·</span>
        <a href="mailto:kontakt@jobswipe.pl" className="hover:text-foreground transition-colors">
          kontakt@jobswipe.pl
        </a>
        <span className="text-border hidden sm:inline">·</span>
        <span>© {new Date().getFullYear()} JobSwipe</span>
      </div>
    </div>
  </footer>
);

export default Footer;
