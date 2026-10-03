import { useDesktop } from "../core/context";
import { profile, projects } from "../data/portfolio";
import { AppIcon } from "../components/Popovers";
import { Icon } from "../components/Icon";
import type { AppId } from "../core/registry";
const links: [AppId, string, string][] = [
  ["projects", "Projects", `${projects.length} applications & workflows`],
  ["resume", "Résumé", "My background and journey"],
  ["contact", "Get in touch", "Email, GitHub & LinkedIn"],
  ["skills", "Skills", "The tools behind the work"],
  ["terminal", "Terminal", "Try help or neofetch"],
  ["games", "Take a break", "DOOM, racing, chess & more"],
];
export default function About() {
  const { open, prefs, setPrefs } = useDesktop();
  return (
    <div className="welcome-app scroll-area">
      <header className="welcome-heading">
        <div className="welcome-avatar">
          HY
          <span />
        </div>
        <div>
          <div className="eyebrow">WELCOME TO MY DESKTOP</div>
          <h1>Hey, I’m Hassan.</h1>
          <p>
            {profile.title}
            <br />
            <span className="welcome-location">
              <Icon name="pin" size={12} />
              {profile.location}
            </span>
          </p>
        </div>
      </header>
      <p className="welcome-description">
        I build web and mobile apps, and automate the work around them. This is
        my little corner of the internet. Open a folder, explore a project, or
        stay for a game.
      </p>
      <div className="welcome-apps">
        {links.map(([app, label, detail]) => (
          <button key={app} onClick={() => open(app)}>
            <AppIcon app={app} />
            <span>
              <strong>{label}</strong>
              <small>{detail}</small>
            </span>
            <Icon name="right" size={14} />
          </button>
        ))}
      </div>
      <div className="welcome-tip">
        <Icon name="info" size={15} />
        <span>
          Make yourself at home. Drag windows, right-click the desktop, or
          search with <kbd>Ctrl K</kbd>.
        </span>
      </div>
      <footer className="welcome-bottom">
        <label>
          <input
            type="checkbox"
            checked={prefs.welcome}
            onChange={(e) => setPrefs({ welcome: e.target.checked })}
          />{" "}
          Show at login
        </label>
        <a href="/portfolio.html">
          Just here for the portfolio <Icon name="external" size={12} />
        </a>
      </footer>
    </div>
  );
}
