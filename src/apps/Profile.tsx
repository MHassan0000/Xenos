import { useState } from "react";
import { profile, skills, journey } from "../data/portfolio";
import { useDesktop } from "../core/context";
import { Icon, DesktopMark } from "../components/Icon";
import { Tags } from "./Projects";
export function Resume() {
  const { open } = useDesktop();
  return (
    <div className="resume-app scroll-area">
      <header className="document-heading">
        <span className="eyebrow">PROFILE / RÉSUMÉ</span>
        <h1>{profile.name}</h1>
        <p>{profile.title}</p>
        <div className="document-meta">
          <span>
            <Icon name="pin" size={14} />
            {profile.location}
          </span>
          <a href={`mailto:${profile.email}`}>
            <Icon name="mail" size={14} />
            {profile.email}
          </a>
        </div>
      </header>
      <section>
        <span className="eyebrow">01 — INTRODUCTION</span>
        <p className="readable">{profile.bio}</p>
      </section>
      <section>
        <span className="eyebrow">02 — ENGINEERING JOURNEY</span>
        <div className="timeline">
          {journey.map((j) => (
            <div className="timeline-entry" key={j.year}>
              <time>{j.year.replace(" - ", " — ")}</time>
              <div>
                <h3>{j.title}</h3>
                <span className="muted small">{j.subtitle}</span>
                <p>{j.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
      <section>
        <span className="eyebrow">03 — TECHNOLOGIES</span>
        {skills.map((s) => (
          <div key={s.name} className="resume-skill">
            <h3>{s.name}</h3>
            <p>{s.items.join(" · ")}</p>
          </div>
        ))}
      </section>
      <footer className="resume-footer">
        <p>
          This profile reflects my published portfolio. For a current CV or a
          specific opportunity, get in touch.
        </p>
        <button className="button" onClick={() => open("contact")}>
          <Icon name="mail" size={16} />
          Contact Hassan
        </button>
      </footer>
    </div>
  );
}
export function Skills() {
  const [tab, setTab] = useState("Overview");
  const { open } = useDesktop();
  return (
    <div className="skills-app scroll-area">
      <div className="system-header">
        <div className="system-mark">
          <DesktopMark />
        </div>
        <div>
          <span className="eyebrow">THE HUMAN BEHIND THE SYSTEM</span>
          <h1>Built for making things.</h1>
          <p>{profile.title}</p>
        </div>
      </div>
      <div className="system-tabs">
        {["Overview", "Technologies", "Experience"].map((t) => (
          <button
            key={t}
            className={tab === t ? "selected" : ""}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>
      {tab === "Overview" ? (
        <>
          <dl className="system-specs">
            <div>
              <dt>Operator</dt>
              <dd>{profile.name}</dd>
            </div>
            <div>
              <dt>Home base</dt>
              <dd>{profile.location}</dd>
            </div>
            <div>
              <dt>Focus</dt>
              <dd>Full-stack products & AI automation</dd>
            </div>
            <div>
              <dt>Experience</dt>
              <dd>Engineering journey since 2020</dd>
            </div>
            <div>
              <dt>Approach</dt>
              <dd>Accessible, fast, maintainable</dd>
            </div>
          </dl>
          <p className="readable muted">{profile.bio}</p>
          <button className="button" onClick={() => open("resume")}>
            <Icon name="file" size={16} />
            Explore my résumé
          </button>
        </>
      ) : tab === "Technologies" ? (
        <div className="skill-groups">
          {skills.map((s) => (
            <section key={s.name}>
              <div className="skill-group-heading">
                <Icon name={s.icon} size={24} />
                <div>
                  <h3>{s.name}</h3>
                  <p>{s.description}</p>
                </div>
                <span className="mono small">{s.items.length} tools</span>
              </div>
              <Tags items={s.items} />
            </section>
          ))}
        </div>
      ) : (
        <div className="timeline">
          {journey.map((j) => (
            <div className="timeline-entry" key={j.year}>
              <time>{j.year}</time>
              <div>
                <h3>{j.title}</h3>
                <p>{j.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="system-foot">
        <Icon name="info" size={13} />A professional profile, presented as
        system information.
      </div>
    </div>
  );
}
export function Contact() {
  const { notify } = useDesktop();
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(profile.email);
      setCopied(true);
      notify("Email address copied");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      notify(
        "Could not access clipboard. Select the email address to copy it.",
      );
    }
  }
  return (
    <div className="contact-app scroll-area">
      <span className="contact-stamp">
        <Icon name="mail" size={26} />
      </span>
      <span className="eyebrow">START A CONVERSATION</span>
      <h1>
        Great things
        <br />
        start with hello<span>.</span>
      </h1>
      <p>
        Have a project in mind, an interesting challenge,
        <br />
        or just something to share? I’m all ears.
      </p>
      <div className="email-card">
        <div>
          <span className="eyebrow">DIRECT LINE</span>
          <a href={`mailto:${profile.email}`}>{profile.email}</a>
        </div>
        <button
          className="icon-button"
          aria-label="Copy email address"
          onClick={copy}
        >
          <Icon name={copied ? "check" : "copy"} size={18} />
        </button>
      </div>
      <div className="contact-links">
        {profile.social.map((s) => (
          <a key={s.name} href={s.url} target="_blank" rel="noreferrer">
            <Icon
              name={
                s.name === "GitHub"
                  ? "github"
                  : s.name === "LinkedIn"
                    ? "linkedin"
                    : "globe"
              }
              size={18}
            />
            <span>{s.name}</span>
            <Icon name="external" size={13} />
          </a>
        ))}
      </div>
      <div className="contact-footer">
        <span>
          <Icon name="pin" size={14} />
          {profile.location}
        </span>
        <a className="button primary" href={`mailto:${profile.email}`}>
          Write an email
          <Icon name="mail" size={16} />
        </a>
      </div>
    </div>
  );
}
