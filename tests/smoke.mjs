// Смоук-тест Lovesick Radio в настоящем браузере.
// Запуск: BASE=https://lovesick-radio.vercel.app npm run test:smoke  (по умолчанию — http://localhost:3000)
// Код выхода 1, если хоть одна проверка упала — так его использует GitHub Actions (.github/workflows/smoke.yml).
import { chromium, devices } from "playwright";

const BASE = (process.env.BASE ?? "http://localhost:3000").replace(/\/$/, "");
const results = [];
const pageErrors = [];
const check = (name, ok, extra = "", { soft = false } = {}) => results.push({ name, ok: !!ok, extra, soft });
// На серверах GitHub (CI=true) YouTube не даёт играть видео с адресов датацентров —
// там это предупреждение, а не провал. С обычного компьютера проверка строгая.
const SOFT_IN_CI = { soft: process.env.CI === "true" };
const player = (p) => p.locator('section[aria-label="Плеер"]');
const position = async (p) => Number(await player(p).locator('input[aria-label="Перемотка"]').first().inputValue());

async function status(path) {
  const res = await fetch(BASE + path, { redirect: "manual" });
  return { code: res.status, headers: res.headers, body: await res.text() };
}

const browser = await chromium.launch({ args: ["--autoplay-policy=no-user-gesture-required"] });
try {
  // --- сервер: коды ответов, заголовки, здоровье источников ---
  const home = await status("/");
  check("главная отвечает 200", home.code === 200, `HTTP ${home.code}`);
  for (const h of ["content-security-policy", "x-frame-options", "x-content-type-options", "referrer-policy"]) {
    check(`заголовок ${h}`, home.headers.get(h));
  }
  check("кривой id трека → 404", (await status("/track/evil-123")).code === 404);
  const health = await status("/api/health");
  check("все источники музыки живы (/api/health)", health.code === 200, health.body.slice(0, 160));

  // --- десктоп ---
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();
  p.on("pageerror", (e) => pageErrors.push(e.message));

  await p.goto(BASE, { waitUntil: "networkidle" });
  check("главная: лента свежих треков", (await p.locator("article").count()) > 0);
  check("главная: чарт", (await p.locator("main ol > li").count()) > 0);
  check("«Все треки» ведёт на /fresh", (await p.getByRole("link", { name: "Все треки" }).first().getAttribute("href")) === "/fresh");

  await p.getByRole("button", { name: "Включить радио" }).click();
  await player(p).waitFor({ timeout: 15000 });
  await p.waitForTimeout(6000);
  check("Audius играет", (await position(p)) > 0.5, `позиция ${(await position(p)).toFixed(1)}`);
  const box = await player(p).boundingBox();
  check("плеер прибит к низу", box && box.y + box.height <= 901 && box.y > 700);

  const t1 = await player(p).locator("a").first().innerText();
  await player(p).getByRole("button", { name: "Следующий" }).last().click();
  await p.waitForTimeout(3000);
  check("«следующий» переключает", t1 !== (await player(p).locator("a").first().innerText()));

  await player(p).getByRole("button", { name: "В любимые" }).click();
  await p.getByRole("link", { name: "Моя коллекция" }).first().click();
  await p.waitForURL("**/library");
  await p.waitForTimeout(800);
  check("лайк попал в коллекцию", (await p.locator("main ol > li").count()) >= 1);
  check("музыка не прервалась при переходе", (await player(p).getByRole("button", { name: "Пауза" }).count()) > 0);

  await p.reload({ waitUntil: "networkidle" });
  await p.waitForTimeout(800);
  check("очередь пережила перезагрузку", await player(p).isVisible());

  await p.goto(`${BASE}/search?q=${encodeURIComponent("ту холис")}`, { waitUntil: "networkidle" });
  check("строка поиска помнит запрос", (await p.getByLabel("Поиск музыки").first().inputValue()) === "ту холис");
  const first = p.locator("main ol").first().locator("li").first();
  check("поиск по-русски находит 2hollis", (await first.innerText()).includes("2hollis"));
  await first.getByRole("button").first().click();
  const dock = p.getByRole("complementary", { name: "Видео YouTube" });
  await dock.waitFor({ state: "visible", timeout: 15000 }).catch(() => {});
  await p.waitForTimeout(8000);
  check(
    "песня из YouTube Music играет",
    (await dock.isVisible()) && (await position(p)) > 1,
    `позиция ${(await position(p)).toFixed(1)}`,
    SOFT_IN_CI,
  );

  await first.locator('a[href^="/track/"]').click();
  await p.waitForURL("**/track/**");
  await p.locator('main button[aria-label="Пауза"]:visible, main button[aria-label="Играть"]:visible').first().waitFor({ timeout: 15000 });
  check("страница трека открывается", (await p.locator("main h1:visible").first().innerText()).length > 0);
  await ctx.close();

  // --- телефон ---
  const m = await browser.newContext({ ...devices["Pixel 7"] });
  const mp = await m.newPage();
  mp.on("pageerror", (e) => pageErrors.push("mobile: " + e.message));
  await mp.goto(BASE, { waitUntil: "networkidle" });
  check("телефон: нет горизонтальной прокрутки", (await mp.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 0);
  await mp.getByRole("button", { name: "Включить радио" }).click();
  await mp.waitForTimeout(3000);
  const mPlayer = player(mp);
  for (const name of ["Предыдущий", "Следующий", "Очередь"]) {
    check(`телефон: кнопка «${name}» в плеере`, await mPlayer.getByRole("button", { name }).first().isVisible());
  }
  check("телефон: перемотка в плеере", await mPlayer.locator('input[aria-label="Перемотка"]').first().isVisible());
  await m.close();
} finally {
  await browser.close();
}

check("нет ошибок на страницах", pageErrors.length === 0, [...new Set(pageErrors)].join(" | "));
for (const r of results) {
  const mark = r.ok ? "PASS" : r.soft ? "WARN" : "FAIL";
  console.log(`${mark} ${r.name}${r.extra ? " — " + r.extra : ""}`);
}
const failed = results.filter((r) => !r.ok && !r.soft).length;
const warned = results.filter((r) => !r.ok && r.soft).length;
console.log(`\n${results.length - failed - warned}/${results.length} прошло${warned ? `, предупреждений: ${warned}` : ""}`);
process.exit(failed ? 1 : 0);
