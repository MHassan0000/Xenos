import type { AppId } from "../core/registry";
import { Icon } from "./Icon";

const glyphTiles: Partial<Record<AppId, [string, string]>> = {
  settings: ["settings", "#36363a|#f1b54c"],
  notes: ["notes", "#55402a|#f2c467"],
  editor: ["edit", "#283f55|#a7d5f3"],
  calculator: ["calculator", "#34363a|#d2d6dc"],
  monitor: ["activity", "#263c32|#83db9b"],
  image: ["image", "#34434e|#b8d7e8"],
  music: ["music", "#443858|#dabaf3"],
  chess: ["chess", "#343238|#e6d5ae"],
  solitaire: ["cards", "#28463b|#d8d5c8"],
  mines: ["bomb", "#493431|#ef967f"],
  brickfall: ["blocks", "#34394d|#b9c8f4"],
  snake: ["snake", "#2e4536|#9fd49d"],
  2048: ["blocks", "#504231|#ffd281"],
};

const folderShape = (
  tint: "home" | "projects" | "games",
  children?: React.ReactNode,
) => {
  const top = tint === "home" ? "#c68027" : "#b97020";
  const body = tint === "home" ? "#e7a33c" : "#eba63b";
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <path d="M7 15a4 4 0 0 1 4-4h14l6 6h22a4 4 0 0 1 4 4v31H7z" fill={top} />
      <path
        d="M7 23a4 4 0 0 1 4-4h42a4 4 0 0 1 4 4v27a4 4 0 0 1-4 4H11a4 4 0 0 1-4-4z"
        fill={body}
      />
      <path d="M8 24h48" stroke="#ffd17a" strokeOpacity=".55" strokeWidth="2" />
      {children}
    </svg>
  );
};

const paper = (tag: "MD" | "PDF") => (
  <svg viewBox="0 0 64 64" aria-hidden="true">
    <path
      d="M17 6h21l13 13v38a3 3 0 0 1-3 3H17a3 3 0 0 1-3-3V9a3 3 0 0 1 3-3"
      fill="#f1eee7"
    />
    <path d="M38 6v11a3 3 0 0 0 3 3h10z" fill="#d6d0c6" />
    <path
      d="M21 27h22M21 33h22M21 39h16"
      stroke="#b8b2a9"
      strokeWidth="2.6"
      strokeLinecap="round"
    />
    <path
      d="M14 44h37v10a3 3 0 0 1-3 3H17a3 3 0 0 1-3-3z"
      fill={tag === "MD" ? "#557fc0" : "#bb4e43"}
    />
    <text
      x="32.5"
      y="52"
      textAnchor="middle"
      fill="white"
      fontSize="10"
      fontWeight="800"
      fontFamily="Inter, sans-serif"
    >
      {tag}
    </text>
  </svg>
);

const browser = (
  <svg viewBox="0 0 64 64" aria-hidden="true">
    <circle cx="31" cy="31" r="22" fill="#318abd" />
    <path
      d="M10 31h42M31 9c-7 7-10 14-10 22s3 16 10 22M31 9c7 7 10 14 10 22s-3 16-10 22M14 20h34M14 42h34"
      fill="none"
      stroke="#abd8ed"
      strokeWidth="1.7"
      opacity=".8"
    />
    <ellipse
      cx="31"
      cy="31"
      rx="30"
      ry="8.5"
      transform="rotate(-27 31 31)"
      fill="none"
      stroke="#f1a838"
      strokeWidth="4"
    />
    <circle cx="52.5" cy="17" r="4" fill="#f4bd56" />
  </svg>
);

const skills = (
  <svg viewBox="0 0 64 64" aria-hidden="true">
    <rect x="4" y="4" width="56" height="56" rx="15" fill="#26352e" />
    <path
      d="M11 35h10l5-12 8 22 7-19 4 9h9"
      fill="none"
      stroke="#72d48b"
      strokeWidth="4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const contact = (
  <svg viewBox="0 0 64 64" aria-hidden="true">
    <rect x="2" y="2" width="60" height="60" rx="16" fill="#338f87" />
    <circle cx="32" cy="23" r="9" fill="#f4f1e9" />
    <path d="M14 53c1-11 8-17 18-17s17 6 18 17" fill="#f4f1e9" />
  </svg>
);

const terminal = (
  <svg viewBox="0 0 64 64" aria-hidden="true">
    <rect x="3" y="3" width="58" height="58" rx="15" fill="#30302e" />
    <path
      d="m17 22 11 10-11 10"
      fill="none"
      stroke="#f3a832"
      strokeWidth="5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M34 42h14"
      stroke="#d7d0c4"
      strokeWidth="4"
      strokeLinecap="round"
    />
  </svg>
);

const doom = (
  <svg viewBox="0 0 64 64" aria-hidden="true" shapeRendering="crispEdges">
    <rect x="4" y="4" width="56" height="56" rx="12" fill="#33241f" />
    <path d="M15 37h7V24h7v-7h14v7h7v13h6v15H8V43h7z" fill="#d95439" />
    <path d="M22 37V24h7v-7h14v7h7v13h-5v8H27v-8z" fill="#e8c995" />
    <path d="M29 24h6v6h-6zm12 0h6v6h-6zM32 32h7v4h-7z" fill="#352c29" />
    <path d="M21 45h7v7h-7zm21 0h7v7h-7z" fill="#d89c4e" />
    <path d="M11 54h42v5H11z" fill="#a83e2f" />
  </svg>
);

const racer = (
  <svg viewBox="0 0 64 64" aria-hidden="true">
    <rect x="4" y="4" width="56" height="56" rx="14" fill="#292e3b" />
    <path
      d="m18 37 5-13a5 5 0 0 1 5-3h10a5 5 0 0 1 5 3l5 13 5 3v9H11v-9z"
      fill="#eb9e35"
    />
    <path
      d="m25 25-3 10h20l-3-10a2 2 0 0 0-2-2H27a2 2 0 0 0-2 2"
      fill="#82c4df"
    />
    <path d="M13 39h38" stroke="#ffe5ab" strokeWidth="2" />
    <circle cx="20" cy="47" r="4" fill="#26272b" />
    <circle cx="44" cy="47" r="4" fill="#26272b" />
    <path d="M28 40h8" stroke="#d94b3d" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

const trash = (
  <svg viewBox="0 0 64 64" aria-hidden="true">
    <path d="M19 20h26l-2 35H21z" fill="#aab2b5" />
    <path d="M16 17h32v5H16zm11-6h10l3 6H24z" fill="#d4d7d5" />
    <path
      d="M27 27v20m6-20v20m6-20v20"
      stroke="#6f7b80"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
    <path
      d="m13 17 4 4"
      stroke="#f1b340"
      strokeWidth="3"
      strokeLinecap="round"
    />
  </svg>
);

export function DesktopAppIcon({ app }: { app: AppId }) {
  let artwork: React.ReactNode;
  switch (app) {
    case "files":
      artwork = folderShape(
        "home",
        <path d="m21 35 11-10 11 10v12H35v-8h-6v8h-8z" fill="#fff0d5" />,
      );
      break;
    case "projects":
      artwork = folderShape(
        "projects",
        <path
          d="m20 34 12-7 12 7-12 7zm0 5 12 7 12-7m-24 5 12 7 12-7"
          fill="none"
          stroke="#fff1d7"
          strokeWidth="2.8"
          strokeLinejoin="round"
        />,
      );
      break;
    case "games":
      artwork = folderShape(
        "games",
        <>
          <path
            d="M22 34c-4 0-7 3-8 8l-1 5c-.5 3 2 5 5 3l7-5h14l7 5c3 2 5 0 5-3l-1-5c-1-5-4-8-8-8z"
            fill="#fff0d5"
          />
          <path
            d="M22 38v8m-4-4h8"
            stroke="#c7802c"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <circle cx="42" cy="40" r="2" fill="#c7802c" />
          <circle cx="46" cy="45" r="2" fill="#c7802c" />
        </>,
      );
      break;
    case "document":
      artwork = paper("MD");
      break;
    case "resume":
      artwork = paper("PDF");
      break;
    case "browser":
      artwork = browser;
      break;
    case "skills":
      artwork = skills;
      break;
    case "contact":
      artwork = contact;
      break;
    case "terminal":
      artwork = terminal;
      break;
    case "doom":
      artwork = doom;
      break;
    case "racer":
      artwork = racer;
      break;
    case "trash":
      artwork = trash;
      break;
    default:
      const [iconName, colors] = glyphTiles[app] || [
        "files",
        "#30313a|#d8dee8",
      ];
      const [background, foreground] = colors.split("|");
      artwork = (
        <span
          className="desktop-glyph-tile"
          style={{ background, color: foreground }}
        >
          <Icon name={iconName} size={34} />
        </span>
      );
  }

  return (
    <span className={`desktop-app-icon desktop-app-icon-${app}`}>
      {artwork}
    </span>
  );
}
