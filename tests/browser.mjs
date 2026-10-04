import { chromium, expect } from "@playwright/test";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
await mkdir(".qa", { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  permissions: ["clipboard-read", "clipboard-write"],
});
const page = await context.newPage();
const origin = process.env.DESKTOP_TEST_URL || "http://127.0.0.1:5173";
const errors = [],
  failed = [],
  checks = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => {
  if (m.type() === "error")
    errors.push(`${m.text()} (${m.location().url || "unknown source"})`);
});
page.on("requestfailed", (r) => {
  if (
    !r.url().includes("favicon") &&
    r.failure()?.errorText !== "net::ERR_ABORTED"
  )
    failed.push(r.url() + ": " + r.failure()?.errorText);
});
page.on("response", (r) => {
  if (r.status() >= 400) failed.push(`${r.status()} ${r.url()}`);
});
const check = (name) => {
  checks.push(name);
  console.log("PASS " + name);
};
const win = (id) => page.locator(`[data-window="${id}"]`);
const button = (name) => page.getByRole("button", { name, exact: true });
async function launcher(name) {
  await button("Open application launcher").click();
  const menu = page.getByRole("dialog", { name: "Application launcher" });
  await menu.getByRole("textbox", { name: "Search applications" }).fill(name);
  await menu
    .locator(".menu-apps > button")
    .filter({
      has: page.locator("strong", { hasText: new RegExp("^" + name + "$") }),
    })
    .click();
}
async function search(query) {
  await button("Search apps and projects").click();
  await page.getByRole("combobox", { name: "Search Desktop" }).fill(query);
  await page.keyboard.press("Enter");
}
async function geometry(id) {
  return win(id).boundingBox();
}
async function terminal(cmd) {
  await win("terminal")
    .getByRole("textbox", { name: "Terminal command" })
    .fill(cmd);
  await page.keyboard.press("Enter");
}
async function finishStartup() {
  const skip = button("Skip startup");
  if (await skip.isVisible().catch(() => false)) await skip.click();
}
try {
  await page.goto(origin);
  await win("about").waitFor();
  await finishStartup();
  if (await button("Dismiss welcome notification").isVisible())
    await button("Dismiss welcome notification").click();
  await page.evaluate(() => document.fonts.ready);
  check("First arrival shows welcome and project, résumé, contact routes");
  await page.screenshot({ path: ".qa/desktop-welcome.png" });
  await page
    .getByRole("button", { name: "Open Projects", exact: true })
    .click();
  assert.equal(await win("projects").count(), 0);
  await page
    .getByRole("button", { name: "Open Projects", exact: true })
    .dblclick();
  await win("projects").waitFor();
  check("Desktop single-click selection and double-click launching");
  assert.equal(await win("projects").locator(".project-card").count(), 29);
  await win("projects")
    .getByRole("button", { name: "Automations 11", exact: true })
    .click();
  assert.equal(await win("projects").locator(".project-card").count(), 11);
  await win("projects")
    .getByRole("button", { name: "All projects 29", exact: true })
    .click();
  await win("projects")
    .getByRole("textbox", { name: "Search projects" })
    .fill("Axon");
  assert.equal(await win("projects").locator(".project-card").count(), 1);
  await win("projects").locator(".project-card").click();
  await win("project:axon").waitFor();
  assert.equal(
    await win("project:axon")
      .getByRole("link", { name: /Live project/ })
      .getAttribute("href"),
    "https://axon-sigma.vercel.app/",
  );
  check("All 29 projects, filters, search, details and verified links");
  await win("project:axon").getByRole("button", { name: "Copy link" }).click();
  assert.match(
    await page.evaluate(() => navigator.clipboard.readText()),
    /#\/project\/axon$/,
  );
  check("Project share links copy correctly");
  await button("Close Axon").click();
  await win("projects")
    .getByRole("textbox", { name: "Search projects" })
    .fill("");
  const original = await geometry("projects");
  await button("Maximize Projects").click();
  assert.ok((await geometry("projects")).width > 1300);
  await button("Restore Projects").click();
  assert.deepEqual(await geometry("projects"), original);
  check("Maximize and exact previous-geometry restoration");
  const title = win("projects").locator(".titlebar");
  let box = await title.boundingBox();
  await page.mouse.move(box.x + 150, box.y + 20);
  await page.mouse.down();
  await page.mouse.move(box.x + 200, box.y + 65, { steps: 8 });
  await page.mouse.up();
  const moved = await geometry("projects");
  assert.ok(moved.x > original.x);
  check("Pointer dragging moves a window");
  await win("projects")
    .locator(".titlebar")
    .dblclick({ position: { x: 200, y: 20 } });
  assert.ok((await geometry("projects")).width > 1300);
  await win("projects")
    .locator(".titlebar")
    .dblclick({ position: { x: 200, y: 20 } });
  check("Titlebar double-click toggles maximize");
  let resize = await win("projects")
    .locator('[data-resize="se"]')
    .boundingBox();
  const before = await geometry("projects");
  await page.mouse.move(resize.x + 6, resize.y + 6);
  await page.mouse.down();
  await page.mouse.move(resize.x - 85, resize.y - 45, { steps: 8 });
  await page.mouse.up();
  const resized = await geometry("projects");
  assert.ok(resized.width < before.width - 50);
  check("Corner resize changes dimensions with responsive content");
  box = await title.boundingBox();
  await page.mouse.move(box.x + 100, box.y + 20);
  await page.mouse.down();
  await page.mouse.move(2, 200, { steps: 12 });
  await page.mouse.up();
  await page.waitForTimeout(250);
  assert.ok((await geometry("projects")).width < 730);
  assert.equal(Math.round((await geometry("projects")).x), 8);
  await button("Restore Projects").click();
  check("Dragging to screen edge snaps; restore recovers normal geometry");
  await button("Minimize Projects").click();
  assert.equal(await win("projects").isVisible(), false);
  await button("Projects — 1 open").click();
  assert.equal(await win("projects").isVisible(), true);
  check("Minimize and taskbar restoration");
  await launcher("Contact");
  await button("Copy email address").click();
  assert.equal(
    await page.evaluate(() => navigator.clipboard.readText()),
    "hassanyousaf140@gmail.com",
  );
  assert.equal(
    await win("contact")
      .getByRole("link", { name: "Write an email" })
      .getAttribute("href"),
    "mailto:hassanyousaf140@gmail.com",
  );
  check("Launcher, contact links and clipboard");
  await button("Welcome — 1 open").click();
  assert.ok(
    await win("about").evaluate((el) => el.classList.contains("active")),
  );
  check("Window stacking and taskbar focus");
  await button("Show desktop or restore windows").click();
  assert.equal(await page.locator(".os-window:visible").count(), 0);
  await button("Show desktop or restore windows").click();
  assert.ok((await page.locator(".os-window:visible").count()) >= 3);
  check("Show desktop and restore window set");
  await search("Oraclex");
  await win("project:oraclex").waitFor();
  check("Global search opens matching project");
  await launcher("Files");
  await win("files")
    .getByRole("button", { name: "Documents", exact: true })
    .click();
  await win("files")
    .locator(".file-item")
    .filter({ hasText: "Resume.md" })
    .click();
  await win("resume").waitFor();
  await button("Close Résumé").click();
  await win("files").getByRole("button", { name: "Back", exact: true }).click();
  assert.ok(
    await win("files")
      .locator(".file-item")
      .filter({ hasText: "Projects" })
      .count(),
  );
  await win("files")
    .getByRole("button", { name: "Forward", exact: true })
    .click();
  assert.ok(
    await win("files")
      .locator(".file-item")
      .filter({ hasText: "Resume.md" })
      .count(),
  );
  check("Files navigation, breadcrumbs, back/forward and document opening");
  await win("files")
    .getByRole("button", { name: "Pictures", exact: true })
    .click();
  await win("files").locator(".file-item").first().click();
  await page.locator('[data-window^="image:"]').waitFor();
  check("Image files open the image viewer");
  await launcher("Terminal");
  await terminal("cd Documents");
  await terminal("cat About.md");
  assert.match(await win("terminal").innerText(), /Muhammad Hassan Yousaf/);
  await terminal("ls");
  await terminal("cd missing");
  assert.match(await win("terminal").innerText(), /Not a directory/);
  await terminal("nonsense");
  assert.match(await win("terminal").innerText(), /command not found/);
  await page.keyboard.press("ArrowUp");
  assert.equal(await win("terminal").locator("input").inputValue(), "nonsense");
  await win("terminal").locator("input").fill("neo");
  await page.keyboard.press("Tab");
  assert.equal(await win("terminal").locator("input").inputValue(), "neofetch");
  await page.keyboard.press("Enter");
  assert.match(await win("terminal").innerText(), /No access to your computer/);
  await terminal("open axon");
  await win("project:axon").waitFor();
  check(
    "Terminal virtual paths, read, list, errors, history, completion, neofetch and app opening",
  );
  await button("Project — 2 open").click();
  await page
    .getByRole("dialog", { name: "Open windows" })
    .getByRole("button", { name: /Oraclex/ })
    .click();
  assert.ok(
    await win("project:oraclex").evaluate((el) =>
      el.classList.contains("active"),
    ),
  );
  check("Taskbar window picker switches between multiple project windows");
  await launcher("System Info");
  await win("skills")
    .getByRole("button", { name: "Technologies", exact: true })
    .click();
  assert.equal(
    await win("skills").locator(".skill-groups .tags span").count(),
    27,
  );
  await win("skills")
    .getByRole("button", { name: "Experience", exact: true })
    .click();
  assert.equal(await win("skills").locator(".timeline-entry").count(), 6);
  check("System Info exposes all skill groups and verified journey entries");
  await launcher("Settings");
  await win("settings").getByRole("button", { name: "blue accent" }).click();
  await win("settings")
    .getByRole("button", { name: "Afterglow", exact: true })
    .click();
  await win("settings")
    .getByRole("switch", { name: "Interface animations" })
    .click();
  await page.waitForTimeout(250);
  await page.reload();
  await finishStartup();
  if (await page.getByLabel("Workspace locked").isVisible())
    await page.keyboard.press("Enter");
  await win("settings").waitFor();
  assert.equal(await page.locator(".wallpaper-aurora").count(), 1);
  assert.equal(await page.locator(".reduce-motion").count(), 1);
  assert.match(
    await page.evaluate(() => localStorage.getItem("workspace:v2:prefs")),
    /blue/,
  );
  assert.ok(await win("project:axon").count());
  check("Appearance settings and multiwindow session survive reload");
  if (!(await win("settings").isVisible())) await search("Settings");
  else await win("settings").locator(".titlebar").click();
  await win("settings")
    .getByRole("button", { name: "Desktop", exact: true })
    .click();
  await win("settings")
    .getByRole("switch", { name: "Restore my session" })
    .click();
  await page.waitForTimeout(250);
  await page.goto(origin);
  await win("about").waitFor();
  await finishStartup();
  if (await page.getByLabel("Workspace locked").isVisible())
    await page.keyboard.press("Enter");
  assert.equal(await page.locator(".os-window").count(), 1);
  check("Disabling session restoration starts a clean welcome");
  await launcher("Notes");
  await win("notes")
    .getByRole("textbox", { name: "Personal notes" })
    .fill("A local test note.");
  await button("Close Notes").click();
  await launcher("Notes");
  assert.equal(
    await win("notes")
      .getByRole("textbox", { name: "Personal notes" })
      .inputValue(),
    "A local test note.",
  );
  check("Notes persist locally across app reopening");
  await launcher("Settings");
  await win("settings")
    .getByRole("button", { name: "Desktop", exact: true })
    .click();
  await button("Restore defaults").click();
  await button("Reset desktop").click();
  await win("about").waitFor();
  assert.equal(await page.locator(".os-window").count(), 1);
  assert.equal(await page.locator(".wallpaper-midnight").count(), 1);
  assert.equal(await page.locator(".reduce-motion").count(), 0);
  check("Reset restores defaults and window state");
  await page.getByRole("button", { name: /^Clock and calendar/ }).click();
  const cal = page.getByRole("dialog", { name: "Calendar" });
  const month = await cal.locator(".calendar-nav strong").innerText();
  await cal.getByRole("button", { name: "Next month" }).click();
  assert.notEqual(await cal.locator(".calendar-nav strong").innerText(), month);
  await cal.getByRole("button", { name: "Back to today" }).click();
  assert.equal(await cal.locator(".calendar-nav strong").innerText(), month);
  await page.keyboard.press("Escape");
  check("Live calendar month navigation and Escape");
  await page.mouse.click(1250, 580, { button: "right" });
  await page
    .getByRole("dialog", { name: "Desktop menu" })
    .getByRole("button", { name: "Hide desktop icons" })
    .click();
  assert.equal(await page.locator(".desktop-shortcuts").count(), 0);
  await page.mouse.click(1250, 580, { button: "right" });
  await page
    .getByRole("dialog", { name: "Desktop menu" })
    .getByRole("button", { name: "Show desktop icons" })
    .click();
  check("Desktop context menu actions");
  await page.keyboard.press("Control+k");
  assert.ok(
    await page
      .getByRole("combobox", { name: "Search Desktop" })
      .evaluate((el) => el === document.activeElement),
  );
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await win("projects").waitFor();
  check("Keyboard search focus and arrow/Enter navigation");
  await page.goto(origin + "/#/project/axon");
  await win("project:axon").waitFor();
  await launcher("Contact");
  await page.goBack();
  await page.waitForTimeout(100);
  assert.ok(
    await win("project:axon").evaluate((el) => el.classList.contains("active")),
  );
  await page.goForward();
  await page.waitForTimeout(100);
  assert.ok(
    await win("contact").evaluate((el) => el.classList.contains("active")),
  );
  check("Deep links and browser back/forward");
  await page.setViewportSize({ width: 1024, height: 768 });
  for (const el of await page.locator(".os-window:visible").all()) {
    const b = await el.boundingBox();
    assert.ok(b.x >= 0 && b.y >= 0 && b.x + b.width <= 1025);
  }
  await page.screenshot({ path: ".qa/tablet.png" });
  check("Tablet viewport keeps titlebars and controls reachable");
  const tabletRect = await geometry("contact");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(100);
  await page.setViewportSize({ width: 1024, height: 768 });
  await expect.poll(() => geometry("contact")).toEqual(tabletRect);
  check("Mobile presentation preserves desktop window geometry");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(origin + "/#/about");
  await finishStartup();
  await win("about").waitFor();
  const mobile = await geometry("about");
  assert.equal(mobile.width, 390);
  assert.equal(mobile.x, 0);
  assert.ok(
    await win("about")
      .getByRole("button", { name: "Projects 29 applications & workflows" })
      .isVisible(),
  );
  await page.screenshot({ path: ".qa/mobile-welcome.png" });
  await win("about")
    .getByRole("button", { name: "Projects 29 applications & workflows" })
    .click();
  await page.screenshot({ path: ".qa/mobile-projects.png" });
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
    false,
  );
  check(
    "Mobile maximized apps, scrolling, project routes and no page overflow",
  );
  await launcher("Contact");
  await page.screenshot({ path: ".qa/mobile-contact.png" });
  await page.emulateMedia({ reducedMotion: "reduce" });
  assert.equal(
    await win("contact").evaluate((el) => getComputedStyle(el).animationName),
    "none",
  );
  check("Device reduced-motion preference overrides animations");
  await page.goto(origin + "/#/about");
  await win("about").waitFor();
  const livePortfolio = win("about").getByRole("link", {
    name: "Open my live portfolio",
  });
  await expect(livePortfolio).toHaveAttribute(
    "href",
    /#\/browser\/https%3A%2F%2Fhassanyousaf\.vercel\.app/,
  );
  await livePortfolio.click();
  await expect(win("browser").locator("iframe")).toHaveAttribute(
    "src",
    "https://hassanyousaf.vercel.app/",
  );
  check("Portfolio shortcut opens Hassan’s live website in the OS Browser");
  // Seed storage outside the running desktop so its session persistence cannot
  // overwrite the deliberately invalid record while navigation begins.
  await page.goto(origin + "/robots.txt");
  await page.evaluate(() => {
    localStorage.setItem(
      "workspace:v2:session",
      '[{"app":"evil","rect":null}]',
    );
    localStorage.setItem("workspace:v2:prefs", "null");
  });
  await page.goto(origin);
  await win("about").waitFor();
  await finishStartup();
  assert.equal(await page.locator(".os-window").count(), 1);
  check("Malformed saved state safely falls back to defaults");
  assert.deepEqual(errors, []);
  assert.deepEqual(failed, []);
  check("No runtime errors or failed assets across the walkthrough");
  console.log(`\n${checks.length} browser checks passed.`);
} catch (error) {
  await page.screenshot({ path: ".qa/failure.png" }).catch(() => {});
  console.error(error);
  process.exitCode = 1;
}
await writeFile(
  ".qa/browser-results.json",
  JSON.stringify({ checks, errors, failed }, null, 2),
);
await browser.close();
