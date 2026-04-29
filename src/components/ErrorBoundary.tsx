import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  fallback?: (reset: () => void, error: Error) => ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error("ErrorBoundary caught:", error, info);
  }

  reset = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      if (this.props.fallback) return this.props.fallback(this.reset, this.state.error);
      return (
        <div className="flex flex-col items-center justify-center min-h-[300px] p-6 text-center gap-3">
          <div className="text-3xl">⚠️</div>
          <p className="font-medium text-foreground">Something went wrong</p>
          <p className="text-sm text-muted-foreground max-w-sm">
            {this.state.error.message || "An unexpected error occurred."}
          </p>
          <Button onClick={this.reset} className="bg-primary text-primary-foreground">
            Retry
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
