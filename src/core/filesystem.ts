import { profile, projects, skills, journey } from "../data/portfolio";
import { getDocuments } from "./localFiles";
import { getSessionEntries } from "./sessionFiles";
import { gameIds, registry } from "./registry";
export type FileNode = {
  path: string;
  name: string;
  type:
    | "folder"
    | "document"
    | "project"
    | "image"
    | "link"
    | "app"
    | "local"
    | "session";
  content?: string;
  target?: string;
};
const folder = (path: string): FileNode => ({
  path,
  name: path.split("/").pop() || "Home",
  type: "folder",
});
export const files: FileNode[] = [
  folder("/"),
  folder("/Projects"),
  folder("/Documents"),
  folder("/Pictures"),
  folder("/Links"),
  folder("/Games"),
  folder("/Downloads"),
  ...gameIds.map((id) => ({
    path: `/Games/${registry[id].name}`,
    name: registry[id].name,
    type: "app" as const,
    target: id,
    content: registry[id].description,
  })),
  {
    path: "/Documents/About.md",
    name: "About.md",
    type: "document",
    content: `# ${profile.name}\n${profile.title}\n${profile.location}\n\n${profile.bio}`,
  },
  {
    path: "/Documents/Resume.md",
    name: "Resume.md",
    type: "document",
    content:
      `# ${profile.name}\n${profile.title}\n${profile.location}\n${profile.email}\n\n${profile.bio}\n\n` +
      journey
        .map((j) => `${j.year} — ${j.title}\n${j.description}`)
        .join("\n\n"),
  },
  {
    path: "/Documents/Skills.md",
    name: "Skills.md",
    type: "document",
    content: skills
      .map((s) => `# ${s.name}\n${s.items.join(", ")}`)
      .join("\n\n"),
  },
  {
    path: "/Documents/Contact.txt",
    name: "Contact.txt",
    type: "document",
    content:
      `${profile.name}\n${profile.email}\n${profile.location}\n` +
      profile.social.map((s) => `${s.name}: ${s.url}`).join("\n"),
  },
  ...projects.map((p) => ({
    path: `/Projects/${p.id}.md`,
    name: `${p.id}.md`,
    type: "project" as const,
    target: p.id,
    content: `# ${p.name}\n${p.category}\n\n${p.description}\n\n${p.tags.join(", ")}\n${p.demo || ""}\n${p.repo || ""}`,
  })),
  ...projects.flatMap((p) =>
    p.images.map((img, i) => ({
      path: `/Pictures/${p.id}${i ? `-${i + 1}` : ""}.webp`,
      name: `${p.id}${i ? `-${i + 1}` : ""}.webp`,
      type: "image" as const,
      target: img,
    })),
  ),
  ...profile.social.map((s) => ({
    path: `/Links/${s.name}.url`,
    name: `${s.name}.url`,
    type: "link" as const,
    target: s.url,
    content: s.url,
  })),
  {
    path: "/Links/Portfolio.url",
    name: "Portfolio.url",
    type: "link" as const,
    target: profile.source,
    content: profile.source,
  },
];
export function normalizePath(path: string, cwd = "/") {
  const parts: string[] = [];
  for (const part of (path.startsWith("/") ? path : `${cwd}/${path}`).split(
    "/",
  )) {
    if (part === "..") parts.pop();
    else if (part && part !== "." && part !== "~") parts.push(part);
  }
  return "/" + parts.join("/");
}
export const allFiles = (): FileNode[] => [
  ...files,
  ...getDocuments()
    .filter((d) => !d.deleted)
    .map((d) => ({
      path: `/Documents/${d.name}`,
      name: d.name,
      type: "local" as const,
      content: d.content,
      target: d.id,
    })),
  ...getSessionEntries(),
];
export const getFile = (path: string) =>
  allFiles().find(
    (f) => f.path.toLowerCase() === normalizePath(path).toLowerCase(),
  );
export const childrenOf = (path: string) =>
  allFiles().filter(
    (f) =>
      f.path !== "/" &&
      f.path.slice(0, f.path.lastIndexOf("/")) === (path === "/" ? "" : path),
  );
