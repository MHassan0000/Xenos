import { useDesktop } from "../core/context";
import { profile, projects } from "../data/portfolio";
import { Icon, XenosMark } from "../components/Icon";
export default function About() {
  const { open } = useDesktop();
  return (
    <div className="about-layout">
      <aside className="about-sidebar">
        <div className="avatar">
          hy
          <span />
        </div>
        <strong>{profile.name}</strong>
        <span className="muted small">Engineer. Maker. Builder.</span>
        <div className="sidebar-divider" />
        <span className="eyebrow">MY WORKSPACE</span>
        <button className="side-link selected" onClick={() => open("about")}>
          <Icon name="home" />
          Overview
        </button>
        <button className="side-link" onClick={() => open("projects")}>
          <Icon name="folder" />
          Selected work<span className="count">{projects.length}</span>
        </button>
        <button className="side-link" onClick={() => open("skills")}>
          <Icon name="cpu" />
          My toolkit
        </button>
        <button className="side-link" onClick={() => open("resume")}>
          <Icon name="file" />
          The journey
        </button>
        <button className="side-link" onClick={() => open("contact")}>
          <Icon name="mail" />
          Get in touch
        </button>
        <div className="sidebar-bottom">
          <Icon name="pin" size={14} /> {profile.location}
          <br />
          <span>hassan@xenos ~</span>
        </div>
      </aside>
      <div className="about-main">
        <div className="about-hero">
          <div className="eyebrow">
            <span className="accent-line" /> WELCOME TO MY CORNER OF THE
            INTERNET
          </div>
          <div className="hero-heading">
            <h1>
              Good ideas.
              <br />
              <span>Built to life.</span>
            </h1>
            <div className="hero-emblem">
              <XenosMark />
              <span>
                PERSONAL
                <br />
                EDITION / 01
              </span>
            </div>
          </div>
          <p className="about-intro">
            Hey, I’m {profile.shortName}.<span className="wave"> ✳</span>
          </p>
          <p className="about-copy">
            {profile.title}.
            <br />
            {profile.welcome}
          </p>
          <div className="button-row">
            <button className="button primary" onClick={() => open("projects")}>
              <Icon name="folder" size={17} />
              Explore my work
            </button>
            <button className="button" onClick={() => open("contact")}>
              <Icon name="mail" size={17} />
              Let’s talk
            </button>
          </div>
        </div>
        <div className="welcome-links">
          <button onClick={() => open("projects")}>
            <Icon name="folder" />
            <span>
              <strong>Projects</strong>
              <small>{projects.length} builds to explore</small>
            </span>
            <Icon name="right" size={16} />
          </button>
          <button onClick={() => open("resume")}>
            <Icon name="file" />
            <span>
              <strong>Résumé</strong>
              <small>The story so far</small>
            </span>
            <Icon name="right" size={16} />
          </button>
        </div>
        <div className="welcome-foot">
          <span>
            <Icon name="command" size={13} /> Make yourself at home. This
            desktop is yours to explore.
          </span>
          <a href="/portfolio.html">
            Simple view <Icon name="external" size={12} />
          </a>
        </div>
      </div>
    </div>
  );
}
