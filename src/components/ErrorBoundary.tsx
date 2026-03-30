import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error("[ErrorBoundary] Uncaught error:", error, info.componentStack);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
            textAlign: "center",
            background: "#0d0d0d",
            color: "#f3f4f6",
            gap: "16px",
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              background: "rgba(239,68,68,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28,
              marginBottom: 8,
            }}
          >
            ⚠
          </div>
          <div>
            <p style={{ fontSize: 18, fontWeight: 700, margin: "0 0 6px" }}>
              Algo correu mal
            </p>
            <p style={{ fontSize: 14, color: "#9ca3af", maxWidth: 300, margin: "0 auto 4px" }}>
              O LiftMate encontrou um erro inesperado.
            </p>
            {this.state.error && (
              <p style={{ fontSize: 11, color: "#6b7280", fontFamily: "monospace", marginTop: 8 }}>
                {this.state.error.message}
              </p>
            )}
          </div>
          <button
            onClick={this.handleReload}
            style={{
              marginTop: 8,
              padding: "12px 28px",
              borderRadius: 12,
              background: "#22c55e",
              color: "#fff",
              fontWeight: 600,
              fontSize: 14,
              border: "none",
              cursor: "pointer",
            }}
          >
            Recarregar app
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
