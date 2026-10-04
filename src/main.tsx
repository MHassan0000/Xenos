import React from "react";
import ReactDOM from "react-dom/client";
import "@fontsource-variable/inter";
import "@fontsource/jetbrains-mono/400.css";
import Desktop from "./Desktop";
import "./styles.css";
import "./styles/refinements.css";
import "./styles/desktop.css";
import "./styles/utilities.css";
import "./styles/games.css";
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <main className="recovery">
        <h1>Let’s reopen your workspace.</h1>
        <p>Your portfolio is still available on Hassan’s website.</p>
        <button
          onClick={() => {
            try {
              localStorage.removeItem("workspace:v2:session");
            } catch {
              /* unavailable */
            }
            location.href = "/";
          }}
        >
          Reset window session
        </button>
        <a href="https://hassanyousaf.vercel.app/" target="_blank" rel="noreferrer">Open portfolio</a>
      </main>
    ) : (
      this.props.children
    );
  }
}
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <Desktop />
    </ErrorBoundary>
  </React.StrictMode>,
);
