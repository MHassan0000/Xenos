import { childrenOf, getFile, normalizePath, allFiles } from "./filesystem";
import { profile, projects, skills } from "../data/portfolio";
import { isApp, launchable, type AppId } from "./registry";
export const commands = [
  "help",
  "about",
  "projects",
  "skills",
  "contact",
  "ls",
  "cd",
  "cat",
  "pwd",
  "clear",
  "open",
  "neofetch",
  "date",
  "tree",
  "whoami",
  "uname",
  "echo",
  "fortune",
  "man",
  "games",
];
export type CommandResult = {
  output: string;
  cwd?: string;
  open?: { app: AppId; arg?: string };
  clear?: boolean;
};
export function runCommand(input: string, cwd: string): CommandResult {
  const parts =
    input
      .match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g)
      ?.map((s) => s.replace(/^['"]|['"]$/g, "")) || [];
  const cmd = parts[0]?.toLowerCase();
  const arg = parts.slice(1).join(" ");
  const target = arg === "~" ? "/" : normalizePath(arg || ".", cwd);
  const file = getFile(target);
  switch (cmd) {
    case "tree":
      return {
        output: allFiles()
          .filter((f) => f.path.startsWith(target))
          .map(
            (f) =>
              "  ".repeat(Math.max(0, f.path.split("/").length - 2)) +
              (f.type === "folder" ? "▸ " : "  ") +
              f.name,
          )
          .join("\n"),
      };
    case "whoami":
      return { output: `${profile.name}  ·  hassan@xenos` };
    case "uname":
      return { output: "Xenos OS 1.0 · Personal workspace · Browser environment" };
    case "echo":
      return { output: arg };
    case "fortune":
      return {
        output: [
          "Make it work. Make it clear. Make it feel right.",
          "The best interface gets out of your way.",
          "Small details make a desktop feel like home.",
        ][Math.floor(Math.random() * 3)],
      };
    case "man":
      return {
        output:
          arg === "hassan"
            ? `${profile.name}\n\n${profile.bio}\n\nCONTACT\n${profile.email}`
            : "Try: man hassan · help · open games",
      };
    case "games":
      return {
        output:
          "DOOM · Night Drive · Solitaire · Chess · 2048 · Brickfall · Mines · Snake\nTry: open doom",
        open: { app: "games" },
      };
    case undefined:
      return { output: "" };
    case "help":
      return {
        output:
          "EXPLORE\n  about       Meet Hassan\n  projects    List all 29 projects & workflows\n  skills      Read the technology stack\n  contact     Email & social links\n  man hassan  Read the profile manual\n  games       Open the game library\n\nNAVIGATE\n  ls [path]   List a folder\n  cd <path>   Change folder (.. goes up, ~ goes home)\n  cat <file>  Read a portfolio document\n  tree [path] Show the folder tree\n  pwd         Current folder\n  open <app, project or file>\n\nEXTRAS\n  neofetch    About this workspace\n  whoami      Workspace owner\n  uname       Environment information\n  echo <text> Print text\n  fortune     A small thought\n  date        Current date in Lahore\n  clear       Clear the terminal\n\n↑ / ↓ history · Tab completion · Quotes work for paths with spaces",
      };
    case "about":
      return {
        output: `${profile.name}\n${profile.title}\n${profile.location}\n\n${profile.bio}`,
      };
    case "projects":
      return {
        output:
          projects.map((p) => `${p.id.padEnd(36)} ${p.category}`).join("\n") +
          "\n\nTry: open axon",
      };
    case "skills":
      return {
        output: skills
          .map((s) => `${s.name}\n  ${s.items.join(", ")}`)
          .join("\n\n"),
      };
    case "contact":
      return {
        output:
          `${profile.email}\n${profile.location}\n\n` +
          profile.social.map((s) => `${s.name}: ${s.url}`).join("\n"),
      };
    case "pwd":
      return { output: cwd };
    case "ls":
      if (!file) return { output: `ls: ${arg}: No such file or directory` };
      return {
        output:
          file.type === "folder"
            ? childrenOf(file.path)
                .map((f) => f.name + (f.type === "folder" ? "/" : ""))
                .join("\n")
            : file.name,
      };
    case "cd":
      if (!arg || arg === "~") return { output: "", cwd: "/" };
      if (!file || file.type !== "folder")
        return { output: `cd: ${arg}: Not a directory` };
      return { output: "", cwd: file.path };
    case "cat":
      if (!arg) return { output: "Usage: cat <file>" };
      if (!file) return { output: `cat: ${arg}: No such file` };
      if (file.type === "folder")
        return { output: `cat: ${arg}: Is a directory` };
      return {
        output:
          file.content || `Image file. Use open "${file.path}" to view it.`,
      };
    case "clear":
      return { output: "", clear: true };
    case "open": {
      const alias: Record<string, AppId> = {
        welcome: "about",
        résumé: "resume",
        explorer: "files",
      };
      const app = alias[arg] || arg;
      if (isApp(app) && launchable.includes(app))
        return { output: `Opening ${arg}…`, open: { app } };
      const p = projects.find(
        (p) =>
          p.id === arg.toLowerCase() ||
          p.name.toLowerCase() === arg.toLowerCase(),
      );
      if (p)
        return {
          output: `Opening ${p.name}…`,
          open: { app: "project", arg: p.id },
        };
      if (file && arg) {
        if (file.type === "app" && file.target && isApp(file.target))
          return {
            output: `Opening ${file.name}…`,
            open: { app: file.target },
          };
        if (file.type === "local")
          return {
            output: `Opening ${file.name}…`,
            open: { app: "editor", arg: file.target },
          };
        if (file.type === "link") return { output: file.target || "" };
        return {
          output: `Opening ${file.name}…`,
          open: {
            app:
              file.type === "folder"
                ? "files"
                : file.type === "project"
                  ? "project"
                  : file.type === "image"
                    ? "image"
                    : "document",
            arg: file.target || file.path,
          },
        };
      }
      return {
        output: `open: ${arg || "(empty)"}: App or file not found. Try "open projects".`,
      };
    }
    case "neofetch": {
      const art = [
        "  ██╗  ██╗███████╗███╗   ██╗ ██████╗ ███████╗",
        "  ╚██╗██╔╝██╔════╝████╗  ██║██╔═══██╗██╔════╝",
        "   ╚███╔╝ █████╗  ██╔██╗ ██║██║   ██║███████╗",
        "   ██╔██╗ ██╔══╝  ██║╚██╗██║██║   ██║╚════██║",
        "  ██╔╝ ██╗███████╗██║ ╚████║╚██████╔╝███████║",
        "  ╚═╝  ╚═╝╚══════╝╚═╝  ╚═══╝ ╚═════╝ ╚══════╝",
      ].join("\n");
      const info = [
        `hassan@xenos`,
        `─────────────────────────────────────────`,
        `OS         Xenos OS 1.0 (Personal Edition)`,
        `Host       Personal Workspace`,
        `Kernel     6.4.0-xenos`,
        `Shell      portfolio-shell 1.0`,
        `DE         Xenos Desktop`,
        `Theme      Obsidian Midnight`,
        `Font       Inter Variable + JetBrains Mono`,
        `Projects   ${projects.length}`,
        `Location   ${profile.location}`,
        `Status     Available for interesting work`,
      ].join("\n");
      return { output: art + "\n\n" + info + "\n" };
    }
    case "date":
      return {
        output:
          new Date().toLocaleString("en-GB", {
            timeZone: "Asia/Karachi",
            dateStyle: "full",
            timeStyle: "short",
          }) + " PKT",
      };
    default:
      return {
        output: `${cmd}: command not found. Type help to see available commands.`,
      };
  }
}
export function completeCommand(input: string, cwd: string) {
  const parts = input.split(" ");
  const last = parts.at(-1) || "";
  if (parts.length === 1) return commands.filter((c) => c.startsWith(last));
  const base = last.includes("/")
    ? last.slice(0, last.lastIndexOf("/") + 1)
    : "";
  const prefix = last.slice(base.length).toLowerCase();
  const candidates = childrenOf(normalizePath(base || ".", cwd))
    .filter((f) => f.name.toLowerCase().startsWith(prefix))
    .map((f) => base + f.name + (f.type === "folder" ? "/" : ""));
  if (parts[0] === "open" && !base)
    candidates.push(
      ...launchable.filter((c) => c.startsWith(last)),
      ...projects.filter((p) => p.id.startsWith(last)).map((p) => p.id),
    );
  return [...new Set(candidates)].map((c) =>
    [...parts.slice(0, -1), c].join(" "),
  );
}
