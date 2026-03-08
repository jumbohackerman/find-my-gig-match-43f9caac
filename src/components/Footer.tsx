import { Link } from "react-router-dom";

const Footer = () => (
  <footer className="border-t border-border px-6 py-4">
    <div className="max-w-md mx-auto flex items-center justify-center gap-4 text-xs text-muted-foreground">
      <Link to="/privacy" className="hover:text-foreground transition-colors">Polityka Prywatności</Link>
      <span className="text-border">·</span>
      <Link to="/terms" className="hover:text-foreground transition-colors">Regulamin</Link>
      <span className="text-border">·</span>
      <span>© {new Date().getFullYear()} JobSwipe</span>
    </div>
  </footer>
);

export default Footer;
