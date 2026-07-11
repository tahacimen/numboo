/* End-to-end smoke test: launches the real game in Chromium, drives the
   grid by always clicking the target cell, and asserts core behaviors.
   Run:  node test/browser.test.js  */
const { chromium } = require("playwright");
const http = require("http");
const fs = require("fs");
const path = require("path");

const WWW = path.join(__dirname, "..", "www");
const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css" };

function serve() {
  return new Promise((resolve) => {
    const srv = http.createServer((req, res) => {
      let p = req.url.split("?")[0];
      if (p === "/") p = "/index.html";
      const file = path.join(WWW, p);
      fs.readFile(file, (err, data) => {
        if (err) {
          res.writeHead(404);
          res.end("nf");
          return;
        }
        res.writeHead(200, { "Content-Type": MIME[path.extname(file)] || "text/plain" });
        res.end(data);
      });
    });
    srv.listen(0, () => resolve({ srv, port: srv.address().port }));
  });
}

let pass = 0,
  fail = 0;
function ok(cond, msg) {
  if (cond) {
    pass++;
    console.log("  ✓ " + msg);
  } else {
    fail++;
    console.error("  ✗ " + msg);
  }
}

(async () => {
  const { srv, port } = await serve();
  const browser = await chromium.launch({
    executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = [];
  // Ignore expected offline resource failures (Google Fonts CDN is blocked in
  // the sandbox); the game uses system-font fallbacks and works regardless.
  const isNetworkNoise = (s) =>
    /Failed to load resource|ERR_|net::|fonts\.(googleapis|gstatic)/i.test(s);
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => {
    if (m.type() === "error" && !isNetworkNoise(m.text())) errors.push(m.text());
  });

  await page.goto(`http://localhost:${port}/`, { waitUntil: "load" });

  // Start
  await page.click("#start-btn");
  await page.waitForTimeout(100);
  ok(!(await page.isVisible("#start-overlay")), "start overlay hides after Başla");

  // Drive the game IN-PAGE: dispatch real click events on the correct target
  // cell in a tight loop. Running in-page (no Playwright round-trip latency)
  // keeps the automated player fast enough to top up the timer, so progress is
  // deterministic while still exercising the real delegated click handler.
  const run = await page.evaluate(async (maxClicks) => {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const overlayShown = () =>
      document.getElementById("gameover-overlay").classList.contains("show");
    let clicks = 0,
      sawCombo = false,
      leveledUp = false,
      softLock = false;
    for (let i = 0; i < maxClicks && !overlayShown(); i++) {
      const active = document.querySelector(".q.active");
      if (!active) {
        await sleep(4);
        continue;
      }
      const t = active.textContent.trim();
      const cells = [...document.querySelectorAll('.cell[data-r="7"]')];
      const hit = cells.find((c) => {
        const n = c.querySelector(".cnum");
        return n && n.textContent === t;
      });
      if (!hit) {
        // Regression guard: the game must never present a target that has no
        // instance in the bottom row (soft-lock — see freeze-path anti-lock).
        softLock = true;
        break;
      }
      hit.click(); // real click event -> delegated onCellClick
      clicks++;
      if (parseInt(document.getElementById("stat-level").textContent, 10) >= 2)
        leveledUp = true;
      const combo = document.getElementById("combo-text").textContent;
      if (combo && combo.includes("COMBO")) sawCombo = true;
      await sleep(3);
    }
    return {
      clicks,
      sawCombo,
      leveledUp,
      softLock,
      gameOver: overlayShown(),
      score: parseInt(document.getElementById("stat-score").textContent, 10),
      badges: parseInt(document.getElementById("stat-badges").textContent, 10),
    };
  }, 120);

  ok(!run.softLock, "never soft-locks (target always reachable)");
  ok(run.score > 0, "score increases with correct clicks (score=" + run.score + ")");
  ok(run.clicks >= 20, "sustained many correct clicks (" + run.clicks + ")");
  ok(run.sawCombo, "combo indicator appears");
  ok(run.leveledUp, "level advances past 1 (badge earned)");
  ok(run.badges >= 1, "badge count persisted to >=1 (" + run.badges + ")");
  const badges = run.badges;

  // Force a wrong click -> instant game over (in-page real click event).
  if (!run.gameOver) {
    const died = await page.evaluate(async () => {
      const active = document.querySelector(".q.active").textContent.trim();
      const cells = [...document.querySelectorAll('.cell[data-r="7"]')];
      const wrong = cells.find((c) => {
        const n = c.querySelector(".cnum");
        return n && n.textContent !== active && !c.classList.contains("freeze");
      });
      if (!wrong) return false;
      wrong.click();
      await new Promise((r) => setTimeout(r, 650));
      return document
        .getElementById("gameover-overlay")
        .classList.contains("show");
    });
    ok(died, "wrong click triggers game over");
  } else {
    ok(true, "game over reached during run");
  }

  // Continue button reflects badge availability
  const continueDisabled = await page.evaluate(
    () => document.getElementById("continue-btn").disabled
  );
  ok(continueDisabled === badges <= 0, "continue button enabled iff badges>0");

  // localStorage persistence keys exist
  const best = await page.evaluate(() => localStorage.getItem("numdrop_best"));
  ok(best !== null && parseInt(best, 10) >= 0, "best score saved to localStorage");

  ok(errors.length === 0, "no runtime/console errors" + (errors.length ? ": " + errors[0] : ""));

  await browser.close();
  srv.close();

  console.log("\n" + pass + " passed, " + fail + " failed");
  process.exit(fail ? 1 : 0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
