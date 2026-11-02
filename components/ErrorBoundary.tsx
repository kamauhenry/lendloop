"use client";

import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    // Best-effort POST to server — server writes to logs/YYYY-MM-DD.log
    fetch("/api/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        source: "ErrorBoundary",
        message: error.message,
        stack: `${error.stack ?? ""}\n\nComponent stack:${info.componentStack}`,
      }),
    }).catch(() => {});
  }

  render() {
    if (this.state.error) {
      return (
        this.props.fallback ?? (
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <p className="text-gray-500 text-sm">Something went wrong.</p>
              <button
                onClick={() => this.setState({ error: null })}
                className="mt-3 text-sm text-gray-900 underline"
              >
                Try again
              </button>
            </div>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
