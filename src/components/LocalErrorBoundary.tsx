import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  /** Friendly name shown in the fallback UI */
  label?: string;
  /** Compact mode for inline panels / cards */
  compact?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Lightweight local error boundary that catches render errors
 * within a single panel / modal / section without crashing the page.
 */
class LocalErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[LocalErrorBoundary${this.props.label ? ` – ${this.props.label}` : ""}]`, error, info);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    const { label, compact } = this.props;
    const isDev = import.meta.env.DEV;

    if (compact) {
      return (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-secondary border border-border text-xs text-muted-foreground">
          <AlertTriangle className="w-3.5 h-3.5 text-destructive shrink-0" />
          <span className="flex-1">
            {label ? `Nie udało się załadować: ${label}` : "Coś poszło nie tak"}
          </span>
          <button
            onClick={this.handleRetry}
            className="flex items-center gap-1 text-[10px] font-semibold text-primary hover:underline"
          >
            <RefreshCw className="w-3 h-3" /> Ponów
          </button>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
        <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-3">
          <AlertTriangle className="w-5 h-5 text-destructive" />
        </div>
        <p className="text-sm font-semibold text-foreground mb-1">
          {label ? `Nie udało się załadować: ${label}` : "Coś poszło nie tak"}
        </p>
        <p className="text-xs text-muted-foreground max-w-[260px] mb-3">
          Spróbuj ponownie. Jeśli problem się powtarza, odśwież stronę.
        </p>

        {isDev && this.state.error && (
          <details className="mb-3 w-full max-w-sm text-left">
            <summary className="text-[10px] text-muted-foreground cursor-pointer hover:text-foreground">
              Szczegóły (dev)
            </summary>
            <pre className="mt-1 p-2 rounded-lg bg-secondary border border-border text-[10px] text-destructive overflow-x-auto whitespace-pre-wrap">
              {this.state.error.message}
            </pre>
          </details>
        )}

        <button
          onClick={this.handleRetry}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-secondary text-secondary-foreground text-xs font-medium hover:bg-muted transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Spróbuj ponownie
        </button>
      </div>
    );
  }
}

export default LocalErrorBoundary;
