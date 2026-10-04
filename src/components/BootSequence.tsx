import { useEffect, useRef, useState } from "react";
import { Icon, DesktopMark } from "./Icon";
import { profile } from "../data/portfolio";

/* ─── Boot Lines ─────────────────────────────────────────── */
const BOOT_LINES = [
  "[    0.000000] Xenos OS kernel 6.4.0-xenos (gcc 13.2.0)",
  "[    0.000000] Command line: BOOT_IMAGE=/vmlinuz-6.4.0-xenos root=/dev/sda1 quiet splash",
  "[    0.143892] ACPI: Core revision 20230531",
  "[    0.291041] xenos: workspace memory initialized",
  "[    0.412337] PCI: Using configuration type 1 for base access",
  "[    0.590128] clocksource: tsc-early: mask: 0xffffffffffffffff",
  "[    0.702445] ACPI: Added _OSI(Module Device)",
  "[    0.889213] Initializing cgroup subsys cpuset",
  "[    0.944100] Initializing cgroup subsys cpu",
  "[    1.023445] Linux version 6.4.0-xenos",
  "[    1.190887] Calibrating delay loop... 4800.00 BogoMIPS",
  "[    1.334210] pid_max: default: 32768 minimum: 301",
  "[    1.477821] Mount-cache hash table entries: 4096 (order: 3)",
  "[    1.611034] CPU: Physical Processor ID: 0",
  "[    1.789022] Checking 'hlt' instruction... OK",
  "[    1.934555] ACPI: Power Resource [PUBS]",
  "[    2.100334] xenos: loading portfolio filesystem...",
  "[    2.245789] xenos: mounting workspace environment",
  "[    2.399012] Starting system logger...",
  "[    2.512334] systemd[1]: Starting Xenos OS Workspace",
  "[    2.678900] [  OK  ] Started Session D-Bus System Daemon.",
  "[    2.791234] [  OK  ] Started Network Manager.",
  "[    2.912445] [  OK  ] Started Portfolio Engine.",
  "[    3.023112] [  OK  ] Reached target Network.",
  "[    3.145678] xenos: initializing desktop environment...",
  "[    3.267890] [  OK  ] Started Xenos Desktop Shell.",
  "[    3.389012] [  OK  ] Reached target Multi-User System.",
  "[    3.512345] Xenos OS 1.0 — workspace ready",
];

const LOGIN_PROMPT_LINES = [
  "",
  "Xenos OS 1.0 (personal-workspace) tty1",
  "",
];

/* ─── Terminal Boot ──────────────────────────────────────── */
export function TerminalBoot({ onDone }: { onDone: () => void }) {
  const [lines, setLines] = useState<string[]>([]);
  const [phase, setPhase] = useState<"boot" | "login" | "auth">("boot");
  const [loginInput, setLoginInput] = useState("");
  const [loginStep, setLoginStep] = useState<"user" | "pass" | "done">("user");
  const [loginError, setLoginError] = useState(false);
  const [cursor, setCursor] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  /* blinking cursor */
  useEffect(() => {
    const t = setInterval(() => setCursor((c) => !c), 530);
    return () => clearInterval(t);
  }, []);

  /* scroll to bottom */
  useEffect(() => {
    if (scrollRef.current)
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [lines, phase, loginStep]);

  /* feed boot lines one at a time */
  useEffect(() => {
    if (phase !== "boot") return;
    let i = lines.length;
    if (i >= BOOT_LINES.length) {
      const t = setTimeout(() => setPhase("login"), 400);
      return () => clearTimeout(t);
    }
    const delay = i < 5 ? 35 : i < 15 ? 55 : 80;
    const t = setTimeout(
      () => setLines((prev) => [...prev, BOOT_LINES[i]]),
      delay,
    );
    return () => clearTimeout(t);
  }, [lines, phase]);

  /* focus input when login phase starts */
  useEffect(() => {
    if (phase === "login" || phase === "auth") {
      const t = setTimeout(() => inputRef.current?.focus(), 200);
      return () => clearTimeout(t);
    }
  }, [phase, loginStep]);

  function handleLoginSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loginStep === "user") {
      setLoginStep("pass");
      setLoginInput("");
    } else {
      /* accept any password (it's a portfolio!) */
      setLoginError(false);
      setLoginStep("done");
      setPhase("auth");
      setTimeout(onDone, 900);
    }
  }

  return (
    <div className="boot-terminal">
      <div className="boot-terminal-screen" ref={scrollRef}>
        {/* Boot log lines */}
        {lines.map((line, i) => (
          <div
            key={i}
            className={`boot-line ${
              line.includes("[  OK  ]")
                ? "boot-ok"
                : line.includes("xenos:")
                  ? "boot-xenos"
                  : ""
            }`}
          >
            {line}
          </div>
        ))}

        {/* Login prompt */}
        {phase !== "boot" && (
          <>
            {LOGIN_PROMPT_LINES.map((l, i) => (
              <div key={`lp${i}`} className="boot-line boot-prompt-line">
                {l}
              </div>
            ))}
            <form onSubmit={handleLoginSubmit} className="boot-login-form">
              {loginStep === "user" || loginStep === "pass" ? (
                <div className="boot-input-row">
                  <span className="boot-label">
                    {loginStep === "user" ? "xenos login:" : "Password:"}
                  </span>
                  <input
                    ref={inputRef}
                    className="boot-input"
                    type={loginStep === "pass" ? "password" : "text"}
                    value={loginInput}
                    onChange={(e) => setLoginInput(e.target.value)}
                    autoComplete="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    aria-label={loginStep === "user" ? "Username" : "Password"}
                    placeholder={loginStep === "user" ? "hassan" : ""}
                  />
                  <span
                    className="boot-cursor"
                    style={{ opacity: cursor ? 1 : 0 }}
                  >
                    █
                  </span>
                </div>
              ) : null}
              {loginError && (
                <div className="boot-line boot-error">
                  Login incorrect
                </div>
              )}
              {phase === "auth" && (
                <div className="boot-line boot-ok">
                  Welcome to Xenos OS 1.0 — initializing workspace…
                </div>
              )}
            </form>
          </>
        )}

        {/* cursor while booting */}
        {phase === "boot" && lines.length < BOOT_LINES.length && (
          <span className="boot-cursor" style={{ opacity: cursor ? 1 : 0 }}>
            █
          </span>
        )}
      </div>

      <div className="boot-hint">
        {phase === "boot"
          ? "Xenos OS 1.0 — booting workspace…"
          : phase === "login"
            ? "Login: hassan · Password: any key · Press Enter to continue"
            : "Authenticated — loading desktop…"}
      </div>
    </div>
  );
}

/* ─── Premium Lock Screen ───────────────────────────────── */
export function LockScreen({
  now,
  onUnlock,
  onRestart,
  onPower,
}: {
  now: Date;
  onUnlock: () => void;
  onRestart: () => void;
  onPower: () => void;
}) {
  const [pressed, setPressed] = useState(false);
  const [pin, setPin] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (pressed) inputRef.current?.focus();
  }, [pressed]);

  function handleKey(e: React.KeyboardEvent) {
    if (!pressed && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      setPressed(true);
    }
  }

  function handleUnlock(e: React.FormEvent) {
    e.preventDefault();
    onUnlock();
  }

  return (
    <div
      className="lock-screen"
      tabIndex={-1}
      onKeyDown={handleKey}
      onClick={() => !pressed && setPressed(true)}
    >
      {/* Background layers */}
      <div className="lock-bg-layer" aria-hidden="true">
        <div className="lock-ambient-1" />
        <div className="lock-ambient-2" />
        <div className="lock-grain" />
      </div>

      {/* Xenos OS badge top-left */}
      <div className="lock-os-badge" aria-hidden="true">
        <DesktopMark />
        <span>Xenos OS</span>
      </div>

      {/* Center content */}
      <div className={`lock-center ${pressed ? "lock-unlocking" : ""}`}>
        {!pressed ? (
          <>
            {/* Clock */}
            <div className="lock-big-time">
              {now.toLocaleTimeString("en-GB", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
            <div className="lock-big-date">
              {now.toLocaleDateString("en-GB", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </div>

            <div className="lock-divider" aria-hidden="true" />

            {/* User */}
            <div className="lock-user-row">
              <div className="lock-avatar-ring">
                <div className="lock-avatar">HY</div>
              </div>
              <div>
                <div className="lock-username">{profile.name}</div>
                <div className="lock-usersub">Personal workspace · Guest session</div>
              </div>
            </div>

            {/* Prompt */}
            <div className="lock-prompt-hint">
              <Icon name="right" size={14} />
              Click or press Enter to unlock
            </div>
          </>
        ) : (
          <>
            {/* Clock smaller */}
            <div className="lock-small-time">
              {now.toLocaleTimeString("en-GB", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>

            {/* User */}
            <div className="lock-avatar-ring">
              <div className="lock-avatar">HY</div>
            </div>
            <div className="lock-username">{profile.name}</div>

            {/* Unlock form */}
            <form className="lock-form" onSubmit={handleUnlock}>
              <input
                ref={inputRef}
                type="password"
                className="lock-pin-input"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="No password needed"
                autoComplete="off"
                aria-label="Password"
              />
              <button
                type="submit"
                className="lock-enter-btn"
                aria-label="Enter desktop"
              >
                <Icon name="right" size={18} />
              </button>
            </form>

            <small className="lock-hint-text">
              Press Enter to continue · No password needed
            </small>
            <a href="/portfolio.html" className="lock-portfolio-link">
              Open simple portfolio
            </a>
          </>
        )}
      </div>

      {/* Bottom action buttons */}
      <div className="lock-actions-bar">
        <button aria-label="Restart workspace" onClick={onRestart}>
          <Icon name="reset" size={17} />
          <span>Restart</span>
        </button>
        <button aria-label="Shut down workspace" onClick={onPower}>
          <Icon name="power" size={17} />
          <span>Shut down</span>
        </button>
      </div>
    </div>
  );
}
