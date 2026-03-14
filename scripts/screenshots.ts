import { chromium, devices } from "playwright";

const device = devices["iPhone 14"];
const base = "http://localhost:5173";
const pages = [
  "/",
  "/puzzles",
  "/puzzles/eik",
  "/puzzles/eik/solutions",
  "/profile",
];

const browser = await chromium.launch();
const ctx = await browser.newContext({ ...device });

// Dismiss cookie banner by presetting tracking_id=declined
await ctx.addCookies([{
  name: "tracking_id",
  value: "declined",
  domain: "localhost",
  path: "/",
}]);

const page = await ctx.newPage();

for (const path of pages) {
  const url = new URL(path, base);
  await page.goto(url.href);

  const pathname = url.pathname.slice(1).replace(/\//g, "-");
  const filename = pathname || "home";

  await page.screenshot({
    path: `screenshots/${filename}.png`,
    fullPage: true,
  });

  console.log(`screenshots/${filename}.png`);
}

await browser.close();
