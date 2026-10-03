import { useState } from "react";
import { projects, categories, profile, type Project } from "../data/portfolio";
import { useDesktop } from "../core/context";
import { Icon } from "../components/Icon";
export function Tags({ items }: { items: string[] }) {
  return (
    <div className="tags">
      {items.map((t) => (
        <span key={t}>{t}</span>
      ))}
    </div>
  );
}
export function ProjectCard({
  project: p,
  compact = false,
}: {
  project: Project;
  compact?: boolean;
}) {
  const { open } = useDesktop();
  return (
    <button
      className={`project-card ${compact ? "compact" : ""}`}
      onClick={() => open("project", p.id)}
    >
      <div className="project-preview">
        <img src={p.images[0]} alt={`${p.name} preview`} loading="lazy" />
        {p.featured && (
          <span className="featured-badge">
            <Icon name="star" size={11} />
            Featured
          </span>
        )}
        <span className="preview-open">
          <Icon name="external" size={16} />
        </span>
      </div>
      <div className="project-card-body">
        <div className="card-topline">
          <span className="eyebrow">{p.category}</span>
          <Icon name="right" size={15} />
        </div>
        <h3>{p.name}</h3>
        <p>{p.description}</p>
        <div className="card-tech">{p.tags.slice(0, 3).join(" / ")}</div>
      </div>
    </button>
  );
}
export default function Projects() {
  const [category, setCategory] = useState("All projects");
  const [query, setQuery] = useState("");
  const [view, setView] = useState("grid");
  const { open } = useDesktop();
  const filtered = projects
    .filter(
      (p) =>
        (category === "All projects" ||
          (category === "Featured" && p.featured) ||
          p.category === category) &&
        `${p.name} ${p.description} ${p.tags.join(" ")}`
          .toLowerCase()
          .includes(query.toLowerCase()),
    )
    .sort((a, b) => Number(b.featured) - Number(a.featured));
  return (
    <div className="explorer-app">
      <div className="app-toolbar">
        <div className="breadcrumbs">
          <Icon name="home" size={15} />
          <span>{profile.shortName}</span>
          <Icon name="right" size={13} />
          <strong>Projects</strong>
        </div>
        <label className="search-field">
          <Icon name="search" size={15} />
          <input
            aria-label="Search projects"
            placeholder="Search projects…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
      </div>
      <div className="explorer-body">
        <aside className="explorer-sidebar">
          <span className="eyebrow">COLLECTIONS</span>
          {categories.map((c) => (
            <button
              key={c}
              className={`side-link ${category === c ? "selected" : ""}`}
              onClick={() => setCategory(c)}
            >
              <Icon
                name={
                  c === "Featured"
                    ? "star"
                    : c === "Automations"
                      ? "workflow"
                      : c === "AI products"
                        ? "cpu"
                        : "folder"
                }
                size={16}
              />
              <span>{c}</span>
              <span className="count">
                {
                  projects.filter(
                    (p) =>
                      c === "All projects" ||
                      (c === "Featured" && p.featured) ||
                      p.category === c,
                  ).length
                }
              </span>
            </button>
          ))}
          <div className="sidebar-divider" />
          <button
            className="side-link"
            onClick={() => open("files", "/Projects")}
          >
            <Icon name="files" size={16} />
            Open in Files
          </button>
          <div className="sidebar-note">
            Ideas, out
            <br />
            in the wild.<span>Designed. Built. Shipped.</span>
          </div>
        </aside>
        <div className="project-library scroll-area">
          <div className="section-heading">
            <div>
              <span className="eyebrow">THE PROJECT ARCHIVE</span>
              <h2>{category}</h2>
            </div>
            <div className="view-toggle">
              <button
                aria-label="Grid view"
                aria-pressed={view === "grid"}
                onClick={() => setView("grid")}
              >
                <Icon name="grid" size={16} />
              </button>
              <button
                aria-label="List view"
                aria-pressed={view === "list"}
                onClick={() => setView("list")}
              >
                <Icon name="menu" size={16} />
              </button>
            </div>
          </div>
          <div
            className={`project-grid ${view === "list" ? "project-list" : ""}`}
          >
            {filtered.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
          {!filtered.length && (
            <div className="empty-state">
              <Icon name="search" size={30} />
              <h3>No projects found</h3>
              <p>Try a project name or a technology, such as React.</p>
              <button
                className="button"
                onClick={() => {
                  setQuery("");
                  setCategory("All projects");
                }}
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
      </div>
      <footer className="app-status">
        <span>{filtered.length} items</span>
        <span>~/Projects · {category}</span>
      </footer>
    </div>
  );
}
export function ProjectDetail({ id }: { id?: string }) {
  const { open, notify } = useDesktop();
  const p = projects.find((p) => p.id === id);
  if (!p)
    return (
      <div className="empty-state">
        <h2>Project not found</h2>
        <button className="button" onClick={() => open("projects")}>
          Browse projects
        </button>
      </div>
    );
  return (
    <article className="project-detail scroll-area">
      <div className="detail-topline">
        <button className="text-button" onClick={() => open("projects")}>
          <Icon name="left" size={15} />
          Project library
        </button>
        <button
          className="text-button"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(
                `${location.origin}/#/project/${p.id}`,
              );
              notify("Project link copied");
            } catch {
              notify(
                "Copy isn’t available. The project URL is in your address bar.",
              );
            }
          }}
        >
          <Icon name="link" size={15} />
          Copy link
        </button>
      </div>
      <div className="detail-heading">
        <span className="eyebrow">
          {p.category} {p.featured ? " / FEATURED PROJECT" : ""}
        </span>
        <h1>{p.name}</h1>
        <p>{p.description}</p>
        <Tags items={p.tags} />
        <div className="button-row">
          {p.demo && (
            <a
              className="button primary"
              href={p.demo}
              target="_blank"
              rel="noreferrer"
            >
              <Icon name="globe" size={17} />
              Live project
              <Icon name="external" size={14} />
            </a>
          )}
          {p.repo && (
            <a
              className="button"
              href={p.repo}
              target="_blank"
              rel="noreferrer"
            >
              <Icon name="github" size={17} />
              View source
              <Icon name="external" size={14} />
            </a>
          )}
        </div>
      </div>
      <div className="detail-gallery">
        {p.images.map((src, i) => (
          <button
            key={src}
            className="detail-image"
            onClick={() => open("image", src)}
            aria-label={`Open ${p.name} image ${i + 1}`}
          >
            <img
              src={src}
              alt={`${p.name}${p.category === "Automations" ? " workflow diagram" : " project preview"} ${i + 1}`}
              loading="lazy"
            />
            <span>
              <Icon name="fullscreen" size={14} />
              View full image
            </span>
          </button>
        ))}
      </div>
      <div className="detail-footer">
        Part of {profile.shortName}’s portfolio <span>/{p.id}</span>
      </div>
    </article>
  );
}
