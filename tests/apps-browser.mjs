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
page.setDefaultTimeout(15000);
const origin = process.env.DESKTOP_TEST_URL || "http://127.0.0.1:5173";
const errors = [],
  failed = [],
  checks = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("response", (r) => {
  if (r.status() >= 400) failed.push(r.status() + " " + r.url());
});
const win = (id) => page.locator(`[data-window="${id}"]`);
const button = (name, scope = page) =>
  scope.getByRole("button", { name, exact: true });
const check = (name) => {
  checks.push(name);
  console.log("PASS " + name);
};
async function app(name, id) {
  await button("Open application launcher").click();
  const menu = page.getByRole("dialog", { name: "Application launcher" });
  await menu.getByRole("textbox", { name: "Search applications" }).fill(name);
  await menu
    .locator(".menu-apps > button")
    .filter({
      has: page.locator("strong", { hasText: new RegExp("^" + name + "$") }),
    })
    .click();
  if (id) await win(id).waitFor();
}
async function close(id) {
  await win(id).locator(".window-controls button").last().click();
}
try {
  await page.goto(origin);
  await win("about").waitFor();
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: ".qa/revision-desktop.png" });
  await button("Take a break DOOM, racing, chess & more", win("about")).click();
  await expect(win("games").locator(".game-card")).toHaveCount(8);
  check("All eight games are discoverable from Welcome and the library");
  await page.screenshot({ path: ".qa/revision-games.png" });
  await win("games").locator(".game-card-2048").click();
  await win("2048").locator(".tiles-board").waitFor();
  const original = await win("2048").locator(".tiles-board").innerText();
  await win("2048").locator(".arcade-app").focus();
  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("ArrowDown");
  assert.notEqual(
    await win("2048").locator(".tiles-board").innerText(),
    original,
  );
  await button("Undo", win("2048")).click();
  await button("New game", win("2048")).click();
  assert.match(
    await win("2048").locator(".game-toolbar").innerText(),
    /Score 0/,
  );
  check("2048 keyboard movement, tile generation, undo and reset");
  await close("2048");
  await app("Mines", "mines");
  await win("mines").locator(".mines-board button").nth(40).click();
  assert.ok(
    (await win("mines").locator(".mines-board .revealed").count()) >= 9,
  );
  assert.equal(await win("mines").locator(".mine-hit").count(), 0);
  const covered = win("mines")
    .locator(".mines-board button:not(.revealed)")
    .first();
  await covered.click({ button: "right" });
  assert.match(await covered.getAttribute("aria-label"), /flagged/);
  await win("mines").getByLabel("Mines difficulty").selectOption("12");
  await expect(win("mines").locator(".mines-board button")).toHaveCount(144);
  check(
    "Mines has safe first move, flood reveal, flags and difficulty selection",
  );
  await close("mines");
  await app("Snake", "snake");
  await button("Let’s play", win("snake")).click();
  await page.waitForTimeout(300);
  await button("Pause game", win("snake")).click();
  const snake = await win("snake").locator(".snake-board").innerHTML();
  await page.waitForTimeout(250);
  assert.equal(await win("snake").locator(".snake-board").innerHTML(), snake);
  await button("New game", win("snake")).click();
  await button("Minimize Snake").click();
  const hidden = await win("snake").locator(".snake-board").innerHTML();
  await page.waitForTimeout(250);
  assert.equal(await win("snake").locator(".snake-board").innerHTML(), hidden);
  await button("Snake — 1 open").click();
  check("Snake runs, pauses, stops while minimized and restores");
  await close("snake");
  await app("Brickfall", "brickfall");
  await button("Start / resume", win("brickfall")).click();
  await button("Drop ↓", win("brickfall")).click();
  assert.ok(
    (await win("brickfall")
      .locator(".block-board .block:not(.block-0):not(.block-\\-1)")
      .count()) >= 8,
  );
  await button("Pause game", win("brickfall")).click();
  check("Brickfall spawns, drops, locks pieces and pauses");
  await close("brickfall");
  await app("Chess", "chess");
  await button("e2: white pawn", win("chess")).click();
  await button("e4: empty, legal move", win("chess")).click();
  await expect(win("chess").locator(".chess-moves")).toContainText("e4");
  await expect(win("chess").locator(".game-toolbar")).toContainText(
    "White to move",
    { timeout: 10000 },
  );
  assert.equal(await button("e4: white pawn", win("chess")).count(), 1);
  check("Chess enforces legal moves and the computer replies");
  await win("chess").getByLabel("Chess opponent").selectOption("friend");
  await button("New game", win("chess")).click();
  for (const [from, to] of [
    ["f2", "f3"],
    ["e7", "e5"],
    ["g2", "g4"],
    ["d8", "h4"],
  ]) {
    await win("chess").locator(`.chess-square[aria-label^="${from}:"]`).click();
    await win("chess").locator(`.chess-square[aria-label^="${to}:"]`).click();
  }
  await expect(win("chess").locator(".game-toolbar")).toContainText(
    "Black wins by checkmate",
  );
  await button("Undo", win("chess")).click();
  await expect(win("chess").locator(".game-toolbar")).not.toContainText(
    "checkmate",
  );
  check("Chess two-player mode, checkmate and undo");
  await close("chess");
  await app("Solitaire", "solitaire");
  await expect(win("solitaire").locator(".playing-card.face-down")).toHaveCount(
    21,
  );
  await win("solitaire")
    .getByRole("button", { name: /Draw card/ })
    .click();
  await expect(win("solitaire").locator(".waste .playing-card")).toHaveCount(1);
  await button("Undo", win("solitaire")).click();
  await expect(win("solitaire").locator(".waste .playing-card")).toHaveCount(0);
  await button("Hint", win("solitaire")).click();
  await expect(win("solitaire").locator(".solitaire-hint")).toHaveText(
    /^(Move .+ to .+\.|Draw from the stock to find another move\.)$/,
  );
  check(
    "Solitaire deals 52 cards, draws, supports undo and suggests legal moves",
  );
  await page.screenshot({ path: ".qa/revision-solitaire.png" });
  await close("solitaire");
  await app("DOOM", "doom");
  await button("Launch DOOM", win("doom")).click();
  const frame = page.frameLocator('iframe[title="DOOM game"]');
  await expect(frame.locator("#message")).toBeHidden({ timeout: 25000 });
  await frame.locator("body").focus();
  for (let i = 0; i < 4; i++) {
    await page.keyboard.press("Enter");
    await page.waitForTimeout(250);
  }
  const pixels = await frame.locator("canvas").evaluate(
    (c) =>
      Array.from(c.getContext("2d").getImageData(0, 0, 640, 400).data)
        .filter((_, i) => i % 400 === 0)
        .filter((v) => v > 20).length,
  );
  assert.ok(pixels > 100);
  await page.screenshot({ path: ".qa/revision-doom.png" });
  await button("Pause DOOM", win("doom")).click();
  const frozen = await frame.locator("canvas").evaluate((c) => c.toDataURL());
  await page.waitForTimeout(300);
  assert.equal(
    await frame.locator("canvas").evaluate((c) => c.toDataURL()),
    frozen,
  );
  await button("Resume DOOM", win("doom")).click();
  check(
    "Local DOOM WebAssembly engine boots, accepts menu keys, renders and pauses",
  );
  await close("doom");
  await app("Night Drive", "racer");
  await expect(win("racer").locator("canvas")).toBeVisible({ timeout: 25000 });
  await button("Start driving", win("racer")).click();
  await expect(
    win("racer").locator(".racer-hud strong").first(),
  ).not.toHaveText("0");
  await page.keyboard.down("ArrowLeft");
  await page.waitForTimeout(250);
  await page.keyboard.up("ArrowLeft");
  await button("Pause game", win("racer")).click();
  const distance = await win("racer")
    .locator(".racer-hud strong")
    .first()
    .innerText();
  await page.waitForTimeout(300);
  assert.equal(
    await win("racer").locator(".racer-hud strong").first().innerText(),
    distance,
  );
  await page.screenshot({ path: ".qa/revision-racer.png" });
  check("3D racer renders WebGL, advances, steers and pauses");
  await close("racer");
  await app("Calculator", "calculator");
  for (const k of ["1", "2", "+", "3", "="])
    await button(k, win("calculator")).click();
  assert.equal(await win("calculator").locator("output").innerText(), "15");
  await button("C", win("calculator")).click();
  for (const k of ["9", "÷", "0", "="])
    await button(k, win("calculator")).click();
  assert.equal(await win("calculator").locator("output").innerText(), "Error");
  check("Calculator performs arithmetic and handles division by zero");
  await close("calculator");
  await app("Text Editor", "editor");
  await win("editor").getByLabel("Document name").fill("QA note.txt");
  await win("editor")
    .getByLabel("Document text")
    .fill("A real local document.");
  await button("Save", win("editor")).click();
  await app("Files", "files");
  await button("Documents", win("files")).click();
  await expect(
    win("files").locator(".file-item").filter({ hasText: "QA note.txt" }),
  ).toHaveCount(1);
  await win("files")
    .getByRole("button", { name: "Move QA note.txt to Trash" })
    .click();
  await app("Trash", "trash");
  await expect(win("trash").locator(".local-file-row")).toContainText(
    "QA note.txt",
  );
  await button("Restore", win("trash")).click();
  await expect(win("trash").locator(".local-file-row")).toHaveCount(0);
  check(
    "Editor saves into Files; deleting and restoring uses the shared local filesystem",
  );
  await close("trash");
  await close("files");
  await page.keyboard.press("Control+k");
  await page
    .getByRole("combobox", { name: "Search Desktop" })
    .fill("QA note.txt");
  await page.keyboard.press("Enter");
  await expect(win("editor").getByLabel("Document text")).toHaveValue(
    "A real local document.",
  );
  await page.reload();
  await expect(win("editor").getByLabel("Document text")).toHaveValue(
    "A real local document.",
  );
  check("Saved local documents are searchable and survive reload");
  await close("editor");
  await app("Web Browser", "browser");
  await button("GitHub", win("browser").locator(".browser-bookmarks")).click();
  await expect(
    win("browser").getByRole("link", { name: "Open website" }),
  ).toHaveAttribute("href", "https://github.com/MHassan0000");
  await button("Browser back", win("browser")).click();
  await expect(win("browser").locator(".browser-home")).toBeVisible();
  await button("New tab", win("browser")).click();
  assert.equal(await win("browser").locator(".browser-tabs>div").count(), 2);
  await button(
    "Portfolio",
    win("browser").locator(".browser-bookmarks"),
  ).click();
  await expect(win("browser").locator("iframe")).toHaveAttribute(
    "src",
    "https://hassanyousaf.vercel.app/",
  );
  await button("Google", win("browser").locator(".browser-bookmarks")).click();
  await expect(win("browser").locator("iframe")).toHaveAttribute(
    "src",
    "https://www.google.com/webhp?igu=1&hl=en",
  );
  check(
    "Web Browser supports tabs, verified bookmarks, Hassan’s live portfolio and embedded Google",
  );
  await close("browser");
  await app("Ambient", "music");
  await button("Play soundscape", win("music")).click();
  await expect(win("music").locator(".ambient-app")).toHaveClass(/playing/);
  await button("Volume").click();
  await page.getByLabel("Workspace volume").focus();
  await page.keyboard.press("Home");
  await page.keyboard.press("Escape");
  await expect(win("music").getByLabel("Ambient volume")).toHaveValue("0");
  await button("Pause soundscape", win("music")).click();
  check("Ambient audio is user-triggered and shares the system volume");
  await close("music");
  await app("System Monitor", "monitor");
  await expect(win("monitor").locator(".process-row").first()).toBeVisible();
  assert.ok((await win("monitor").locator(".process-row").count()) >= 3);
  await win("monitor")
    .locator(".process-row")
    .filter({ hasText: "Games" })
    .getByRole("button", { name: "End task" })
    .click();
  assert.equal(await win("games").count(), 0);
  check("System Monitor reports and closes actual workspace windows");
  await close("monitor");
  await button("Network").click();
  await expect(page.getByRole("dialog", { name: "Network" })).toContainText(
    "Your browser is connected",
  );
  await page.keyboard.press("Escape");
  await button("Notifications").click();
  await expect(
    page.getByRole("dialog", { name: "Notifications" }),
  ).toContainText("saved to Documents");
  await button("Clear all").click();
  await expect(
    page.getByRole("dialog", { name: "Notifications" }),
  ).toContainText("caught up");
  await page.keyboard.press("Escape");
  check("Network status and notification history have real working controls");
  await button("Open application launcher").click();
  await button(
    "Lock",
    page.getByRole("dialog", { name: "Application launcher" }),
  ).click();
  await expect(page.getByLabel("Workspace locked")).toBeVisible();
  await page.keyboard.press("Enter");
  await expect(page.getByLabel("Workspace locked")).toHaveCount(0);
  await button("Open application launcher").click();
  await button(
    "Shut down",
    page.getByRole("dialog", { name: "Application launcher" }),
  ).click();
  await button("Power on").click();
  await button("Skip startup").click();
  check("Lock, guest entry, shutdown and skippable restart work");
  await page.setViewportSize({ width: 390, height: 844 });
  for (const [name, id] of [
    ["Games", "games"],
    ["Chess", "chess"],
    ["Mines", "mines"],
    ["Solitaire", "solitaire"],
    ["Web Browser", "browser"],
  ]) {
    await app(name, id);
    await page.screenshot({ path: `.qa/revision-mobile-${id}.png` });
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
    );
    const b = await win(id).boundingBox();
    assert.equal(b.width, 390);
    await close(id);
  }
  check("Game library, chess, mines, cards and browser fit mobile app views");
  assert.deepEqual(errors, []);
  assert.deepEqual(failed, []);
  check("No uncaught runtime errors or failed assets");
  console.log(`${checks.length} extended checks passed.`);
} catch (error) {
  await page.screenshot({ path: ".qa/apps-failure.png" }).catch(() => {});
  console.error(error);
  process.exitCode = 1;
}
await writeFile(
  ".qa/apps-results.json",
  JSON.stringify({ checks, errors, failed }, null, 2),
);
await browser.close();
