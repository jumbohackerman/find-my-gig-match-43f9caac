import { Component, type ErrorInfo, type ReactNode } from "react";
import { Briefcase, RefreshCw, ArrowLeft } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[ErrorBoundary] Uncaught error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  handleReload = () => {
    window.location.href = "/";
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    const isDev = import.meta.env.DEV;

    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="px-6 py-4 border-b border-border flex items-center gap-2">
          <a href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg btn-gradient flex items-center justify-center">
              <Briefcase className="w-4 h-4 text-primary-foreground" />
            </div>
            <h1 className="font-display text-xl font-bold text-foreground">JobSwipe</h1>
          </a>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center px-4 text-center">
          <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mx-auto mb-6 text-4xl">
            ⚠️
          </div>
          <h2 className="font-display text-2xl font-bold text-foreground mb-2">
            Coś poszło nie tak
          </h2>
          <p className="text-sm text-muted-foreground mb-6 max-w-sm">
            Wystąpił nieoczekiwany błąd. Spróbuj odświeżyć stronę lub wrócić do przeglądania ofert.
          </p>

          {isDev && this.state.error && (
            <details className="mb-6 w-full max-w-md text-left">
              <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground mb-2">
                Szczegóły błędu (widoczne tylko w trybie dev)
              </summary>
              <pre className="p-3 rounded-xl bg-secondary border border-border text-xs text-destructive overflow-x-auto whitespace-pre-wrap">
                {this.state.error.message}
                {"\n\n"}
                {this.state.error.stack}
              </pre>
            </details>
          )}

          <div className="flex gap-3 flex-wrap justify-center">
            <button
              onClick={this.handleReload}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl btn-gradient text-primary-foreground text-sm font-medium shadow-glow hover:scale-105 transition-transform"
            >
              <RefreshCw className="w-4 h-4" /> Odśwież
            </button>
            <button
              onClick={this.handleReset}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium hover:bg-muted transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Spróbuj ponownie
            </button>
          </div>
        </main>

        <footer className="border-t border-border px-6 py-3 shrink-0">
          <div className="max-w-md mx-auto flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <a href="/privacy" className="hover:text-foreground transition-colors">Polityka Prywatności</a>
            <span className="text-border">·</span>
            <a href="/terms" className="hover:text-foreground transition-colors">Regulamin</a>
          </div>
        </footer>
      </div>
    );
  }
}

export default ErrorBoundary;
