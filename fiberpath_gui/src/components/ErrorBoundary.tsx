import { Component, ReactNode, ErrorInfo } from "react";

interface Props {
  children: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);

    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: "40px",
            textAlign: "center",
            color: "var(--text-primary, #e0e0e0)",
            background: "var(--bg-primary, #0d0d0f)",
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <h1 style={{ color: "#e74c3c", marginBottom: "20px" }}>
            Something went wrong
          </h1>
          <p style={{ marginBottom: "20px", maxWidth: "600px" }}>
            An unexpected error occurred. Please try refreshing the page.
          </p>
          {this.state.error && (
            <details
              style={{
                textAlign: "left",
                maxWidth: "600px",
                marginTop: "20px",
              }}
            >
              <summary style={{ cursor: "pointer", marginBottom: "10px" }}>
                Error details
              </summary>
              <pre
                style={{
                  padding: "10px",
                  background: "var(--bg-card, #1a1a1c)",
                  borderRadius: "4px",
                  overflow: "auto",
                  fontSize: "12px",
                }}
              >
                {this.state.error.toString()}
                {"\n\n"}
                {this.state.error.stack}
              </pre>
            </details>
          )}
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: "30px",
              padding: "10px 20px",
              background: "var(--primary, #12a89a)",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            Reload Application
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
