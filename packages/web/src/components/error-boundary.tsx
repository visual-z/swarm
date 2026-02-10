import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  featureName?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(
      `[ErrorBoundary${this.props.featureName ? `:${this.props.featureName}` : ""}]`,
      error,
      errorInfo,
    );
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <FeatureErrorFallback
          featureName={this.props.featureName}
          error={this.state.error}
          onRetry={this.handleRetry}
        />
      );
    }

    return this.props.children;
  }
}

interface FeatureErrorFallbackProps {
  featureName?: string;
  error?: Error | null;
  onRetry?: () => void;
}

export function FeatureErrorFallback({
  featureName,
  error,
  onRetry,
}: FeatureErrorFallbackProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-destructive/10">
        <AlertTriangle className="size-8 text-destructive-foreground" />
      </div>
      <div className="text-center">
        <h2 className="text-lg font-semibold">
          {featureName
            ? `Something went wrong in ${featureName}`
            : "Something went wrong"}
        </h2>
        <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
          An unexpected error occurred. Try refreshing or click retry below.
        </p>
        {error?.message && (
          <p className="mt-2 max-w-md rounded-lg bg-muted px-3 py-2 font-mono text-xs text-muted-foreground">
            {error.message}
          </p>
        )}
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw className="size-4" />
          Retry
        </Button>
      )}
    </div>
  );
}
