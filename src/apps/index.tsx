import { lazy, Suspense } from "react";
import About from "./About";
import Projects, { ProjectDetail } from "./Projects";
import { Resume, Skills, Contact } from "./Profile";
import Files, { DocumentViewer, ImageViewer } from "./Files";
import Settings from "./Settings";
import type { WindowState } from "../core/windows";
const Terminal = lazy(() => import("./Terminal"));
const Notes = lazy(() => import("./Notes"));
const Browser = lazy(() => import("./Browser"));
const Ambient = lazy(() => import("./Ambient"));
const Editor = lazy(() =>
  import("./Utilities").then((m) => ({ default: m.Editor })),
);
const Calculator = lazy(() =>
  import("./Utilities").then((m) => ({ default: m.Calculator })),
);
const Monitor = lazy(() =>
  import("./Utilities").then((m) => ({ default: m.Monitor })),
);
const Trash = lazy(() =>
  import("./Utilities").then((m) => ({ default: m.Trash })),
);
const Games = lazy(() => import("./games/Games"));
const Doom = lazy(() => import("./games/Doom"));
const Racer = lazy(() => import("./games/Racer"));
const Chess = lazy(() => import("./games/Chess"));
const Solitaire = lazy(() => import("./games/Solitaire"));
const Arcade = lazy(() => import("./games/Arcade"));
export function Application({
  win,
  active,
}: {
  win: WindowState;
  active: boolean;
}) {
  let app;
  switch (win.app) {
    case "browser":
      app = <Browser initialUrl={win.arg} />;
      break;
    case "editor":
      app = <Editor id={win.arg} />;
      break;
    case "calculator":
      app = <Calculator />;
      break;
    case "monitor":
      app = <Monitor />;
      break;
    case "trash":
      app = <Trash />;
      break;
    case "music":
      app = <Ambient />;
      break;
    case "games":
      app = <Games />;
      break;
    case "doom":
      app = <Doom active={active} />;
      break;
    case "racer":
      app = <Racer active={active} />;
      break;
    case "chess":
      app = <Chess active={active} />;
      break;
    case "solitaire":
      app = <Solitaire />;
      break;
    case "2048":
    case "mines":
    case "snake":
    case "brickfall":
      app = <Arcade game={win.app} active={active} />;
      break;
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
      app = <Terminal initialPath={win.arg} />;
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
