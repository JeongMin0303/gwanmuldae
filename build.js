#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, "data");
const SITE_URL = "https://gwanmuldae.kr";
const BRANCHES = [
  {
    key: "army",
    file: "army.html",
    label: "육군",
    className: "branch-army",
    cardText: "육군훈련소·사단 신교대 준비물을 확인하세요.",
    meta: "육군 입대 준비물 체크리스트. 입영통지서, 신분증, 나라사랑카드, 휴대전화 충전기 등 필수품과 개인 상황별 준비물을 확인하세요.",
  },
  {
    key: "navy",
    file: "navy.html",
    label: "해군",
    className: "branch-navy",
    cardText: "해군 기초군사교육단 준비물을 확인하세요.",
    meta: "해군 입대 준비물 체크리스트. 해군 기초군사교육단 입영 전 필수 서류와 생활 준비물을 확인하세요.",
  },
  {
    key: "marine",
    file: "marine.html",
    label: "해병대",
    className: "branch-marine",
    cardText: "해병대 교육훈련단 준비물을 확인하세요.",
    meta: "해병대 입대 준비물 체크리스트. 해병대 교육훈련단 입영 전 기본 준비물과 개인 상황별 준비물을 확인하세요.",
  },
  {
    key: "airforce",
    file: "airforce.html",
    label: "공군",
    className: "branch-airforce",
    cardText: "공군 기본군사훈련단 준비물을 확인하세요.",
    meta: "공군 입대 준비물 체크리스트. 공군 기본군사훈련단 입영 전 필수 서류와 개인 상황별 준비물을 확인하세요.",
  },
];

const qnaFile = (page) => (page === 1 ? "qna.html" : `qna-${page}.html`);
const urlFor = (file) => (file === "index.html" ? `${SITE_URL}/` : `${SITE_URL}/${file}`);

function readJson(name) {
  return JSON.parse(fs.readFileSync(path.join(DATA_DIR, name), "utf8"));
}

function writeFile(name, content) {
  fs.writeFileSync(path.join(ROOT, name), content.trimStart() + "\n", "utf8");
}

function readSiteConfig() {
  const fallback = {
    site: { name: "관물대", url: SITE_URL, lastModified: "2026-07-02" },
    notice: {
      enabled: true,
      message: "관물대는 입대 준비 정보를 계속 업데이트하고 있습니다.",
      lastUpdated: "2026.07.02",
      linkText: "최근 변경 내용 보기",
      href: "qna.html",
    },
  };

  try {
    return { ...fallback, ...readJson("site.json") };
  } catch {
    return fallback;
  }
}

const SITE_CONFIG = readSiteConfig();
const LASTMOD = SITE_CONFIG.site?.lastModified || "2026-07-02";

function isoDate(value = LASTMOD) {
  const normalized = String(value || "").replace(/\./g, "-");
  return /^\d{4}-\d{2}-\d{2}$/.test(normalized) ? normalized : LASTMOD;
}

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function safeJson(value) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

function brand() {
  return `<a class="brand" href="index.html" aria-label="관물대 홈으로 이동"><span class="brand-mark" aria-hidden="true"><svg focusable="false" viewBox="0 0 48 48" aria-hidden="true"><rect class="brand-locker-outline" x="8" y="8" width="32" height="32" rx="12"></rect><rect class="brand-locker-door" x="14" y="15" width="20" height="18" rx="5"></rect><path class="brand-locker-line" d="M19 21h10M19 27h10"></path><path class="brand-locker-accent" d="M31.5 20.5v7"></path></svg></span><span class="brand-word">관물대</span></a>`;
}

function nav(current = "") {
  const links = BRANCHES.map((branch) => `<a class="nav-link${current === branch.key ? " is-current" : ""}" href="${branch.file}">${branch.label}</a>`).join("");
  return `<nav class="site-nav" aria-label="주요 페이지">${links}<a class="nav-link${current === "qna" ? " is-current" : ""}" href="qna.html">Q&amp;A</a></nav>`;
}

function header(current = "", includeNav = true) {
  return `<header class="site-header"><div class="container header-inner">${brand()}${includeNav ? nav(current) : ""}</div></header>`;
}

function updateNotice() {
  const notice = SITE_CONFIG.notice || {};
  if (!notice.enabled) return "";

  const message = escapeHtml(notice.message || "관물대는 입대 준비 정보를 계속 업데이트하고 있습니다.");
  const lastUpdated = escapeHtml(notice.lastUpdated || LASTMOD.replace(/-/g, "."));
  const href = escapeHtml(notice.href || "qna.html");
  const linkText = escapeHtml(notice.linkText || "최근 변경 내용 보기");

  return `<aside class="update-notice container" aria-label="사이트 업데이트 안내">
      <div class="update-notice-inner">
        <p><span class="update-dot" aria-hidden="true"></span><span>${message}</span> <span class="update-date">최근 업데이트: <time datetime="${isoDate(notice.lastUpdated)}">${lastUpdated}</time></span></p>
        <a class="update-link" href="${href}">${linkText}<span aria-hidden="true">→</span></a>
      </div>
    </aside>`;
}

function analyticsSnippet() {
  return `<script>window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };</script>
    <script defer src="/_vercel/insights/script.js"></script>`;
}

function bodyScripts() {
  return `${analyticsSnippet()}
    <script src="script.js" defer></script>`;
}

function footer() {
  return `<footer class="site-footer"><div class="container footer-inner"><p>관물대가 당신의 첫걸음을 응원합니다.</p><p>문의사항: <a href="mailto:hakires03@gmail.com">hakires03@gmail.com</a></p><p>Copyright © 2026 관물대. All Rights Reserved.</p></div></footer>`;
}

function head({ title, description, file, type = "website", jsonLd }) {
  const canonical = urlFor(file);
  const escapedTitle = escapeHtml(title);
  const escapedDescription = escapeHtml(description);
  const ld = jsonLd ? `<script type="application/ld+json">${safeJson(jsonLd)}</script>` : "";
  return `<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapedTitle}</title>
    <meta name="description" content="${escapedDescription}" />
    <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large" />
    <meta name="googlebot" content="index, follow, max-snippet:-1, max-image-preview:large" />
    <meta name="theme-color" content="#071322" />
    <meta name="date" content="${LASTMOD}" />
    <link rel="canonical" href="${canonical}" />
    <meta property="og:type" content="${type}" />
    <meta property="og:locale" content="ko_KR" />
    <meta property="og:site_name" content="관물대" />
    <meta property="og:title" content="${escapedTitle}" />
    <meta property="og:description" content="${escapedDescription}" />
    <meta property="og:url" content="${canonical}" />
    <meta name="twitter:card" content="summary" />
    <meta name="twitter:title" content="${escapedTitle}" />
    <meta name="twitter:description" content="${escapedDescription}" />
    <link rel="stylesheet" href="styles.css" />
    ${ld}
  </head>`;
}

function breadcrumbSchema(items) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: urlFor(item.file),
    })),
  };
}

function branchIcon(key) {
  return `<span class="branch-icon" data-icon="${key}" aria-hidden="true"></span>`;
}

function branchCard(branch) {
  return `<a class="branch-card ${branch.className}" href="${branch.file}">
    <div class="branch-card-top">
      ${branchIcon(branch.key)}
      <span class="branch-arrow" aria-hidden="true"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7"></path><path d="M9 7h8v8"></path></svg></span>
    </div>
    <h2>${branch.label}</h2>
    <p>${escapeHtml(branch.cardText)}</p>
  </a>`;
}

function itemListSchema(data, branch) {
  const items = (data.categories || []).flatMap((category) =>
    (category.items || []).map((item) => ({ name: item.title, description: item.description, category: category.title }))
  );
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `${branch.label} 입대 준비물 체크리스트`,
    description: branch.meta,
    url: urlFor(branch.file),
    inLanguage: "ko-KR",
    dateModified: LASTMOD,
    breadcrumb: breadcrumbSchema([
      { name: "관물대", file: "index.html" },
      { name: `${branch.label} 입대 준비물`, file: branch.file },
    ]),
    mainEntity: {
      "@type": "ItemList",
      name: `${branch.label} 입대 준비물 목록`,
      itemListElement: items.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        item: {
          "@type": "Thing",
          name: item.name,
          description: item.description,
        },
      })),
    },
  };
}

function categoryHtml(branchKey, category) {
  const categoryId = escapeHtml(category.id);
  const addId = `add-${escapeHtml(branchKey)}-${categoryId}`;
  const items = (category.items || []).map((item) => checkItemHtml(item)).join("\n");
  return `<article class="category" data-category="${categoryId}">
    <div class="category-head">
      <div>
        <h3>${escapeHtml(category.title)}</h3>
        <p>${escapeHtml(category.description)}</p>
      </div>
      <button class="add-button" type="button" data-action="toggle-add" aria-label="${escapeHtml(category.title)}에 항목 추가"><span class="add-plus" aria-hidden="true"></span></button>
    </div>
    <form class="add-form" data-add-form hidden>
      <label class="sr-only" for="${addId}">${escapeHtml(category.title)} 준비물 추가</label>
      <input id="${addId}" name="item" type="text" maxlength="32" autocomplete="off" placeholder="준비물 이름" />
      <button type="submit">추가</button>
    </form>
    <ul class="item-list">
      ${items}
    </ul>
  </article>`;
}

function checkItemHtml(item) {
  const id = escapeHtml(item.id);
  return `<li class="check-item" data-id="${id}">
    <div class="check-row">
      <input class="item-check" type="checkbox" id="${id}" data-id="${id}" />
      <label class="fake-check" for="${id}" aria-hidden="true"></label>
      <label class="item-copy" for="${id}"><strong class="item-title">${escapeHtml(item.title)}</strong><em>${escapeHtml(item.description)}</em></label>
    </div>
  </li>`;
}

function buildIndex() {
  const title = "관물대 | 입대 준비물 체크리스트";
  const description = "입영 전 필요한 물건을 육군·해군·해병대·공군 페이지에서 바로 확인하세요.";
  const html = `<!doctype html>
<html lang="ko">
  ${head({
    title,
    description,
    file: "index.html",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "관물대",
      url: urlFor("index.html"),
      description: "육군, 해군, 해병대, 공군 입대 준비물 체크리스트",
      inLanguage: "ko-KR",
      dateModified: LASTMOD,
    },
  })}
  <body class="home-page" data-page="home">
    ${header("", false)}
    ${updateNotice()}
    <main class="container home-shell">
      <section class="home-hero" aria-labelledby="home-title">
        <p class="eyebrow">ENLISTMENT CHECKLIST</p>
        <h1 id="home-title">입대 준비,<br /><span class="hero-brand-accent">관물대</span>와 함께.</h1>
        <p>${description}</p>
      </section>
      <section class="branch-grid" aria-label="군별 체크리스트 선택">
        ${BRANCHES.map(branchCard).join("\n")}
      </section>
      <section class="qna-strip" aria-label="입대 전 자주 묻는 질문">
        <div>
          <span class="tiny-label">Q&amp;A</span>
          <h2>입대 전 자주 묻는 질문을 모았습니다.</h2>
        </div>
        <a class="qna-button" href="qna.html">자주 묻는 질문 보기 <span aria-hidden="true">→</span></a>
      </section>
    </main>
    ${footer()}
    ${bodyScripts()}
  </body>
</html>`;
  writeFile("index.html", html);
}

function buildBranch(branch) {
  const data = readJson(`${branch.key}.json`);
  const categories = data.categories || [];
  const title = `${branch.label} 입대 준비물 체크리스트 | 관물대`;
  const categoriesHtml = categories.map((category) => categoryHtml(branch.key, category)).join("\n");
  const html = `<!doctype html>
<html lang="ko">
  ${head({ title, description: branch.meta, file: branch.file, jsonLd: itemListSchema(data, branch) })}
  <body class="${branch.className}" data-page="checklist" data-branch="${branch.key}">
    ${header(branch.key)}
    ${updateNotice()}
    <main class="container page-shell">
      <section class="branch-hero" aria-labelledby="page-title">
        <div class="hero-copy">
          <div class="branch-label">${branchIcon(branch.key)}<span>${branch.label}</span></div>
          <h1 id="page-title">${escapeHtml(data.title || `${branch.label} 입대 준비물`)}</h1>
          <p>${escapeHtml(data.desc || branch.meta)}</p>
        </div>
        <aside class="progress-card" aria-label="준비 현황">
          <div class="progress-card-top">
            <div class="branch-label small">${branchIcon(branch.key)}<span>${branch.label}</span></div>
            <span class="status-pill">준비 현황</span>
          </div>
          <div class="hero-percent"><strong id="progressText">0%</strong><span id="countText">0 / 0 완료</span></div>
          <div class="progress-track" aria-hidden="true"><span id="progressFill"></span></div>
          <a class="qna-card-link" href="qna.html">
            <span class="qna-icon" data-icon="qna" aria-hidden="true"></span>
            <span><b>입대 전 Q&amp;A</b><em>자주 묻는 질문 확인</em></span>
            <i aria-hidden="true">→</i>
          </a>
        </aside>
      </section>
      <section class="checklist-panel" data-checklist aria-labelledby="checklist-title">
        <div class="panel-head">
          <div>
            <p class="tiny-label">CHECKLIST</p>
            <h2 id="checklist-title">${escapeHtml(data.list || `${branch.label} 준비물 목록`)}</h2>
          </div>
          <p id="leftText">0개 남음</p>
        </div>
        <div class="list-scroll" id="categoryList" aria-live="polite">
          ${categoriesHtml}
        </div>
      </section>
    </main>
    ${footer()}
    ${bodyScripts()}
  </body>
</html>`;
  writeFile(branch.file, html);
}

function qnaSchema(data, pageItems, file) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    name: data.title,
    description: data.description,
    url: urlFor(file),
    inLanguage: "ko-KR",
    dateModified: LASTMOD,
    breadcrumb: breadcrumbSchema([
      { name: "관물대", file: "index.html" },
      { name: "입대 전 Q&A", file },
    ]),
    mainEntity: pageItems.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

function qnaCard(item) {
  return `<article class="qna-card" data-qna-id="${escapeHtml(item.id)}"><h2>${escapeHtml(item.question)}</h2><p>${escapeHtml(item.answer)}</p></article>`;
}

function qnaPagination(current, total) {
  if (total <= 1) return "";
  const prev = current > 1 ? `<a class="page-button" href="${qnaFile(current - 1)}" aria-label="이전 페이지">‹</a>` : `<span class="page-button is-disabled" aria-hidden="true">‹</span>`;
  const next = current < total ? `<a class="page-button" href="${qnaFile(current + 1)}" aria-label="다음 페이지">›</a>` : `<span class="page-button is-disabled" aria-hidden="true">›</span>`;
  const pages = Array.from({ length: total }, (_, index) => {
    const page = index + 1;
    const currentAttr = page === current ? " is-current" : "";
    const aria = page === current ? " aria-current=\"page\"" : "";
    return `<a class="page-button${currentAttr}" href="${qnaFile(page)}"${aria}>${page}</a>`;
  }).join("");
  return `${prev}${pages}${next}`;
}

function buildQnaPages() {
  const data = readJson("qna.json");
  const items = data.items || [];
  const pageSize = Number.isInteger(data.pageSize) && data.pageSize > 0 ? data.pageSize : 8;
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const titleBase = "입대 전 자주 묻는 질문 Q&A | 관물대";
  const description = "입영통지서, 신분증, 나라사랑카드, 휴대전화 충전기, 약과 처방전 등 입대 전 자주 묻는 질문을 정리했습니다.";

  for (let page = 1; page <= pageCount; page += 1) {
    const file = qnaFile(page);
    const start = (page - 1) * pageSize;
    const pageItems = items.slice(start, start + pageSize);
    const title = page === 1 ? titleBase : `입대 전 자주 묻는 질문 Q&A ${page}페이지 | 관물대`;
    const status = items.length ? `총 ${items.length}개 질문` : "등록된 질문이 없습니다.";
    const html = `<!doctype html>
<html lang="ko">
  ${head({ title, description, file, jsonLd: qnaSchema(data, pageItems, file) })}
  <body data-page="qna" data-qna-page="${page}">
    ${header("qna")}
    ${updateNotice()}
    <main class="container qna-shell">
      <section class="qna-hero" aria-labelledby="qna-title">
        <div class="qna-hero-icon"><span class="qna-icon" data-icon="qna" aria-hidden="true"></span></div>
        <p class="eyebrow">QUESTION &amp; ANSWER</p>
        <h1 id="qna-title">자주 묻는 질문</h1>
        <p>${escapeHtml(data.description || "입대 전 자주 묻는 질문을 모았습니다.")}</p>
      </section>
      <section class="qna-tools" aria-label="Q&A 검색">
        <label class="search-box" for="qnaSearch">
          <span data-icon="search" aria-hidden="true"></span>
          <input id="qnaSearch" type="search" autocomplete="off" placeholder="질문 검색" />
          <button class="search-clear" id="qnaClear" type="button" aria-label="검색어 지우기" hidden>×</button>
        </label>
      </section>
      <section aria-label="입대 전 자주 묻는 질문 목록">
        <p class="qna-status" id="qnaStatus" aria-live="polite">${status}</p>
        <div class="qna-grid" id="qnaResults">
          ${pageItems.map(qnaCard).join("\n")}
        </div>
        <nav class="qna-pagination" id="qnaPagination" aria-label="Q&A 페이지">
          ${qnaPagination(page, pageCount)}
        </nav>
      </section>
      <script type="application/json" id="qnaData">${safeJson({ ...data, items })}</script>
    </main>
    ${footer()}
    ${bodyScripts()}
  </body>
</html>`;
    writeFile(file, html);
  }

  // JSON 질문 수가 줄어들었을 때 이전 qna-N.html이 남지 않도록 정리합니다.
  fs.readdirSync(ROOT)
    .filter((name) => /^qna-\d+\.html$/.test(name))
    .forEach((name) => {
      const page = Number(name.match(/^qna-(\d+)\.html$/)?.[1] || 0);
      if (page > pageCount) fs.unlinkSync(path.join(ROOT, name));
    });

  return pageCount;
}

function buildRobots() {
  writeFile("robots.txt", `User-agent: *
Allow: /

Sitemap: ${SITE_URL}/sitemap.xml`);
}

function buildSitemap(qnaPageCount) {
  const files = ["index.html", ...BRANCHES.map((branch) => branch.file), ...Array.from({ length: qnaPageCount }, (_, index) => qnaFile(index + 1))];
  const urlset = files.map((file) => `  <url>
    <loc>${urlFor(file)}</loc>
    <lastmod>${LASTMOD}</lastmod>
  </url>`).join("\n");
  writeFile("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlset}
</urlset>`);
}

function main() {
  buildIndex();
  BRANCHES.forEach(buildBranch);
  const qnaPageCount = buildQnaPages();
  buildRobots();
  buildSitemap(qnaPageCount);
  console.log(`관물대 페이지 생성 완료: ${BRANCHES.length + qnaPageCount + 1}개 HTML, sitemap.xml, robots.txt`);
}

main();
