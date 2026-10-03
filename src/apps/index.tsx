import { lazy, Suspense } from "react";
import About from "./About";
import Projects, { ProjectDetail } from "./Projects";
import { Resume, Skills, Contact } from "./Profile";
import Files, { DocumentViewer, ImageViewer } from "./Files";
import Settings from "./Settings";
import type { WindowState } from "../core/windows";
const Terminal = lazy(() => import("./Terminal"));
const Notes = lazy(() => import("./Notes"));
export function Application({ win }: { win: WindowState }) {
  let app;
  switch (win.app) {
    case "about":
      app = <About />;
      break;
    case "projects":
      app = <Projects />;
      break;
    case "project":
      app = <ProjectDetail id={win.arg} />;
      break;
    case "resume":
      app = <Resume />;
      break;
    case "skills":
      app = <Skills />;
      break;
    case "contact":
      app = <Contact />;
      break;
    case "files":
      app = <Files initialPath={win.arg} />;
      break;
    case "terminal":
      app = <Terminal />;
      break;
    case "settings":
      app = <Settings />;
      break;
    case "notes":
      app = <Notes />;
      break;
    case "document":
      app = <DocumentViewer path={win.arg} />;
      break;
    case "image":
      app = <ImageViewer src={win.arg} />;
      break;
  }
  return (
    <Suspense
      fallback={<div className="empty-state">Opening application…</div>}
    >
      {app}
    </Suspense>
  );
}
