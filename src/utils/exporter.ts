import JSZip from 'jszip';
import { Book, Chapter } from '../types/book';
import { formatChapterNumber } from './romanNumerals';

/**
 * Escapes characters for safe embedding inside HTML attributes or text.
 */
function escapeHtml(str: string): string {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Encodes string to base64 safely supporting Unicode/UTF-8.
 */
function encodeUtf8Base64(str: string): string {
  return btoa(
    encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) =>
      String.fromCharCode(parseInt(p1, 16))
    )
  );
}

/**
 * Builds the chapter HTML document for iframe rendering.
 * CRITICAL: NEVER SLICES OR CUTS THE USER'S HTML!
 * 100% of user scripts, styles, body content, and markup are completely preserved.
 */
export function buildChapterDocument(
  chapter: Chapter,
  book: Book,
  orderLabel: string = '',
  theme: string = 'paper',
  fontSizePx: number = 15
): string {
  const raw = chapter.rawHtml || '';

  // Universal Navigation Bridge for Interactive Chapters
  const bridgeScript = `
  <script id="paginaviva-bridge">
    (function() {
      window.switchTab = function(dest) {
        if (window.parent && window.parent !== window && typeof window.parent.switchTab === 'function') {
          window.parent.switchTab(dest);
        } else {
          window.parent.postMessage({ type: 'PAGINAVIVA_NAVIGATE', destination: dest }, '*');
        }
      };

      window.goNext = function() {
        if (window.parent && window.parent !== window && typeof window.parent.goNext === 'function') {
          window.parent.goNext();
        } else {
          window.parent.postMessage({ type: 'PAGINAVIVA_ACTION', action: 'next' }, '*');
        }
      };

      window.goPrev = function() {
        if (window.parent && window.parent !== window && typeof window.parent.goPrev === 'function') {
          window.parent.goPrev();
        } else {
          window.parent.postMessage({ type: 'PAGINAVIVA_ACTION', action: 'prev' }, '*');
        }
      };

      window.openToc = function() {
        if (window.parent && window.parent !== window && typeof window.parent.openToc === 'function') {
          window.parent.openToc();
        } else {
          window.parent.postMessage({ type: 'PAGINAVIVA_ACTION', action: 'toc' }, '*');
        }
      };

      document.addEventListener('click', function(e) {
        const el = e.target.closest('a, button, [data-jump-chapter], [data-choice]');
        if (!el) return;

        const jump = el.getAttribute('data-jump-chapter') || el.getAttribute('data-jump');
        if (jump) {
          e.preventDefault();
          window.switchTab(jump);
          return;
        }

        const href = el.getAttribute('href');
        if (href && href.startsWith('#')) {
          const targetId = href.substring(1);
          const internalEl = document.getElementById(targetId);
          if (internalEl) {
            return;
          }
          e.preventDefault();
          window.switchTab(targetId);
        }
      }, true);
    })();
  </script>`;

  const themeAndFontStyles = `
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes">
  <style id="paginaviva-theme-styles">
    /* Anti-Font-Boosting on mobile devices */
    *, *::before, *::after {
      box-sizing: border-box;
      -webkit-text-size-adjust: 100% !important;
      -moz-text-size-adjust: 100% !important;
      text-size-adjust: 100% !important;
    }

    :root {
      --theme-size: ${fontSizePx}px;
    }

    html, body {
      font-size: var(--theme-size, 15px);
      line-height: 1.68;
      word-wrap: break-word;
      overflow-wrap: break-word;
      -webkit-overflow-scrolling: touch;
      margin: 0;
      padding: 0;
    }

    /* Bottom padding to guarantee content is NEVER cut off or hidden behind bottom navigation */
    body {
      padding-bottom: 5.5rem !important;
    }

    /* Universal Themes: High Specificity */
    html[data-theme="paper"], body[data-theme="paper"] {
      background-color: #FAF8F5 !important;
      color: #26221F !important;
    }
    html[data-theme="sepia"], body[data-theme="sepia"] {
      background-color: #F4ECD8 !important;
      color: #433422 !important;
    }
    html[data-theme="dark"], body[data-theme="dark"] {
      background-color: #181716 !important;
      color: #E7E2DF !important;
    }

    /* Dark mode text colors */
    html[data-theme="dark"] p,
    html[data-theme="dark"] h1,
    html[data-theme="dark"] h2,
    html[data-theme="dark"] h3,
    html[data-theme="dark"] h4,
    html[data-theme="dark"] h5,
    html[data-theme="dark"] h6,
    html[data-theme="dark"] li,
    html[data-theme="dark"] blockquote,
    html[data-theme="dark"] label {
      color: #E7E2DF !important;
    }

    /* Dark mode cards & interactive boxes */
    html[data-theme="dark"] [class*="card"],
    html[data-theme="dark"] [class*="box"],
    html[data-theme="dark"] details,
    html[data-theme="dark"] [style*="background: #fff"],
    html[data-theme="dark"] [style*="background:#fff"],
    html[data-theme="dark"] [style*="background: white"],
    html[data-theme="dark"] [style*="background:white"] {
      background-color: #242220 !important;
      color: #E7E2DF !important;
      border-color: #3f3c39 !important;
    }

    /* Dark mode buttons */
    html[data-theme="dark"] button,
    html[data-theme="dark"] .choice-btn,
    html[data-theme="dark"] .interactive-btn {
      background-color: #2d2926 !important;
      color: #fbbf24 !important;
      border-color: #57534e !important;
    }

    /* Sepia mode text & cards */
    html[data-theme="sepia"] p,
    html[data-theme="sepia"] h1,
    html[data-theme="sepia"] h2,
    html[data-theme="sepia"] h3,
    html[data-theme="sepia"] h4,
    html[data-theme="sepia"] h5,
    html[data-theme="sepia"] h6,
    html[data-theme="sepia"] li,
    html[data-theme="sepia"] blockquote,
    html[data-theme="sepia"] label {
      color: #433422 !important;
    }

    html[data-theme="sepia"] [class*="card"],
    html[data-theme="sepia"] [class*="box"],
    html[data-theme="sepia"] details,
    html[data-theme="sepia"] [style*="background: #fff"],
    html[data-theme="sepia"] [style*="background:#fff"],
    html[data-theme="sepia"] [style*="background: white"],
    html[data-theme="sepia"] [style*="background:white"] {
      background-color: #EFE5CE !important;
      color: #433422 !important;
      border-color: #DFD2B8 !important;
    }

    html[data-theme="sepia"] button,
    html[data-theme="sepia"] .choice-btn,
    html[data-theme="sepia"] .interactive-btn {
      background-color: #E6DCBF !important;
      color: #854D0E !important;
      border-color: #C8BA9B !important;
    }

    /* Input zoom prevention on mobile */
    input[type="text"], input[type="number"], input[type="password"], textarea, select {
      font-size: 16px !important;
    }

    /* Responsive media */
    img, video, audio, canvas {
      max-width: 100%;
      height: auto;
    }

    /* Interactive button base styling */
    button, .choice-btn, .interactive-btn {
      min-height: 40px;
      touch-action: manipulation;
    }
  </style>`;

  // Check if raw is already a complete HTML document
  const isFullHtml = /<html[\s>]/i.test(raw) || /<body[\s>]/i.test(raw);

  if (isFullHtml) {
    let result = raw;

    // 1. Inject styles into <head> or at start
    if (/<head[^>]*>/i.test(result)) {
      result = result.replace(/<head[^>]*>/i, (m) => m + '\n' + themeAndFontStyles);
    } else {
      result = themeAndFontStyles + '\n' + result;
    }

    // 2. Inject bridge script right before </body> or at end
    if (/<\/body>/i.test(result)) {
      result = result.replace(/<\/body>/i, (m) => bridgeScript + '\n' + m);
    } else {
      result = result + '\n' + bridgeScript;
    }

    // 3. Set data-theme attributes on html and body
    result = result.replace(/<html([^>]*)>/i, (_, attrs) => {
      const cleanAttrs = (attrs || '').replace(/data-theme="[^"]*"/g, '');
      return `<html data-theme="${theme}"${cleanAttrs}>`;
    });

    result = result.replace(/<body([^>]*)>/i, (_, attrs) => {
      const cleanAttrs = (attrs || '').replace(/data-theme="[^"]*"/g, '');
      return `<body data-theme="${theme}"${cleanAttrs}>`;
    });

    return result;
  }

  // Fragment HTML: wrap in full document with container
  const hasH1 = /<h1[\s>]/i.test(raw);
  const autoHeader = !hasH1
    ? `<header style="margin-bottom: 1.5rem; padding-bottom: 0.6rem; border-bottom: 1px solid rgba(0,0,0,0.1);">
        ${orderLabel ? `<div style="font-size: 0.75rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: #ea580c; margin-bottom: 0.35rem;">${escapeHtml(orderLabel)}</div>` : ''}
        <h1 style="font-size: 1.45rem; line-height: 1.25; margin: 0.4rem 0;">${escapeHtml(chapter.title)}</h1>
        ${chapter.subtitle ? `<p style="font-style: italic; opacity: 0.75; font-size: 0.95rem; margin: 0.25rem 0 0;">${escapeHtml(chapter.subtitle)}</p>` : ''}
      </header>`
    : '';

  return `<!DOCTYPE html>
<html lang="${escapeHtml(book.language || 'it')}" data-theme="${theme}">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(chapter.title)}</title>
  ${themeAndFontStyles}
</head>
<body data-theme="${theme}">
  <div style="max-width: 680px; margin: 0 auto; padding: 1.25rem 1rem 5.5rem; width: 100%;">
    ${autoHeader}
    ${raw}
  </div>
  ${bridgeScript}
</body>
</html>`;
}

/**
 * Exports the entire book into a single autonomous standalone HTML file.
 * Preserves 100% of user files, ensures full-height scrolling with zero cutoffs,
 * and synchronizes theme (Carta / Sepia / Notte) and font sizing in real time.
 */
export function exportStandaloneHtmlBook(book: Book): string {
  const chaptersMeta = book.chapters.map((ch, idx) => {
    const seqIdx = book.chapters.slice(0, idx + 1).filter((c) => c.type === ch.type).length;
    const orderLabel = formatChapterNumber(
      ch,
      seqIdx,
      book.settings.numberingStyle,
      book.settings.customPrefix
    );
    return {
      id: ch.id,
      index: idx,
      title: ch.title,
      orderLabel,
      level: ch.level || 1,
      originalFileName: ch.originalFileName || '',
    };
  });

  // Build Table of Contents items HTML
  const tocItemsHtml = chaptersMeta
    .map((item) => {
      return `
        <li class="toc-item level-${item.level} ${item.index === 0 ? 'active' : ''}" id="toc-btn-${item.index}" onclick="showChapter(${item.index})">
          <span class="toc-num">${escapeHtml(item.orderLabel || String(item.index + 1))}</span>
          <span class="toc-text">${escapeHtml(item.title)}</span>
        </li>
      `;
    })
    .join('\n');

  // Build encoded documents for each chapter (100% preserved)
  const chapterDocsEncoded = book.chapters.map((ch, idx) => {
    const meta = chaptersMeta[idx];
    const fullHtml = buildChapterDocument(
      ch,
      book,
      meta.orderLabel,
      book.settings.defaultReaderTheme || 'paper',
      15
    );
    return encodeUtf8Base64(fullHtml);
  });

  return `<!DOCTYPE html>
<html lang="${escapeHtml(book.language || 'it')}" data-theme="paper">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes">
  <title>${escapeHtml(book.title)}</title>
  <meta name="description" content="${escapeHtml(book.description || book.title)}">

  <style>
    /* Global Reset */
    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-text-size-adjust: 100% !important;
      -moz-text-size-adjust: 100% !important;
      text-size-adjust: 100% !important;
    }

    :root {
      --shell-bg: #FAF8F5;
      --shell-text: #26221F;
      --topbar-bg: #1c1917;
      --topbar-text: #ffffff;
      --accent: #ea580c;
      --accent-badge: #fbbf24;
    }

    [data-theme="sepia"] {
      --shell-bg: #F4ECD8;
      --shell-text: #433422;
    }

    [data-theme="dark"] {
      --shell-bg: #181716;
      --shell-text: #E7E2DF;
    }

    html, body {
      height: 100%;
      height: 100dvh;
      overflow: hidden;
      background-color: var(--shell-bg);
      color: var(--shell-text);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, system-ui, sans-serif;
    }

    /* Main Flex Layout: Topbar + Reader Frame + Footer */
    .book-shell {
      display: flex;
      flex-direction: column;
      height: 100%;
      height: 100dvh;
      overflow: hidden;
    }

    /* Fixed Top Navbar */
    .book-navbar {
      flex-shrink: 0;
      height: 52px;
      background: var(--topbar-bg);
      color: var(--topbar-text);
      border-bottom: 2px solid var(--accent);
      padding: 0 0.5rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.35rem;
      z-index: 40;
      box-shadow: 0 2px 8px rgba(0,0,0,0.25);
    }

    .nav-btn {
      background: #292524;
      color: #fff;
      border: 1px solid #44403c;
      padding: 0.35rem 0.6rem;
      border-radius: 8px;
      font-size: 0.82rem;
      font-weight: 700;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      min-height: 38px;
      white-space: nowrap;
      user-select: none;
      touch-action: manipulation;
    }
    .nav-btn:active {
      transform: scale(0.96);
      background: #44403c;
    }

    .nav-title {
      font-weight: 700;
      font-size: 0.95rem;
      color: var(--accent-badge);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      flex: 1;
      text-align: center;
      padding: 0 0.35rem;
    }

    /* Font Size Controls Group */
    .font-controls {
      display: flex;
      align-items: center;
      background: #292524;
      border: 1px solid #44403c;
      border-radius: 8px;
      overflow: hidden;
    }

    .font-btn {
      background: transparent;
      border: none;
      color: #fff;
      padding: 0.35rem 0.55rem;
      font-size: 0.8rem;
      font-weight: 800;
      cursor: pointer;
      min-height: 38px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    .font-btn:hover { background: #383533; }
    .font-btn:active { background: #57534e; }

    .font-badge {
      font-size: 0.75rem;
      font-weight: 800;
      color: var(--accent-badge);
      padding: 0.35rem 0.45rem;
      cursor: pointer;
      border-left: 1px solid #383533;
      border-right: 1px solid #383533;
      min-width: 44px;
      text-align: center;
      font-variant-numeric: tabular-nums;
      user-select: none;
    }
    .font-badge:hover {
      background: #383533;
    }

    /* Central Iframe Container: FULL HEIGHT SCROLL WITH ZERO CUTOFF */
    .book-frame-container {
      flex: 1;
      position: relative;
      overflow: hidden;
      background: var(--shell-bg);
      display: flex;
      width: 100%;
    }

    #book-frame {
      width: 100%;
      height: 100%;
      border: 0;
      display: block;
      background: transparent;
      overflow-y: auto;
      -webkit-overflow-scrolling: touch;
    }

    /* Slide-out Table of Contents Drawer */
    .toc-modal-backdrop {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.65);
      z-index: 60;
      backdrop-filter: blur(2px);
    }
    .toc-modal-backdrop.open { display: block; }

    .toc-drawer {
      position: fixed;
      top: 0; bottom: 0; left: 0;
      width: 320px;
      max-width: 85vw;
      background: #1c1917;
      color: #fff;
      z-index: 70;
      transform: translateX(-100%);
      transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      display: flex;
      flex-direction: column;
      box-shadow: 4px 0 24px rgba(0,0,0,0.5);
    }
    .toc-drawer.open { transform: translateX(0); }

    .toc-header {
      padding: 0.85rem 1rem;
      border-bottom: 1px solid #383533;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
    }
    .toc-header h2 {
      font-size: 1.05rem;
      font-weight: 700;
      color: var(--accent-badge);
    }
    .toc-badge {
      font-size: 0.72rem;
      background: #292524;
      color: #d6d3d1;
      padding: 0.15rem 0.5rem;
      border-radius: 9999px;
      border: 1px solid #44403c;
    }
    .toc-close-btn {
      background: none;
      border: none;
      color: #fff;
      font-size: 1.6rem;
      cursor: pointer;
      padding: 0.2rem 0.5rem;
      line-height: 1;
    }

    .toc-list {
      flex: 1;
      overflow-y: auto;
      padding: 0.65rem;
      list-style: none;
    }

    .toc-item {
      padding: 0.7rem 0.8rem;
      margin-bottom: 0.35rem;
      border-radius: 8px;
      cursor: pointer;
      font-size: 0.86rem;
      display: flex;
      align-items: center;
      gap: 0.55rem;
      color: #d6d3d1;
      border: 1px solid transparent;
      transition: all 0.15s ease;
      min-height: 44px;
      touch-action: manipulation;
    }
    .toc-item:hover {
      background: #292524;
      color: #fff;
    }
    .toc-item.active {
      background: #78350f;
      border-color: #f59e0b;
      color: #fff;
      font-weight: 700;
    }
    .toc-num {
      color: var(--accent-badge);
      font-weight: 700;
      font-size: 0.8rem;
      min-width: 24px;
    }
    .toc-text {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .toc-item.level-2 {
      padding-left: 1.6rem;
      font-size: 0.8rem;
      opacity: 0.9;
    }

    /* Fixed Bottom Reading Bar */
    .book-footer {
      flex-shrink: 0;
      height: 50px;
      background: var(--topbar-bg);
      border-top: 2px solid var(--accent);
      padding: 0 0.75rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
      z-index: 40;
      box-shadow: 0 -2px 10px rgba(0,0,0,0.2);
    }

    .page-indicator {
      color: var(--accent-badge);
      font-size: 0.82rem;
      font-weight: 700;
      font-variant-numeric: tabular-nums;
      white-space: nowrap;
    }
  </style>
</head>
<body data-theme="paper">

  <div class="book-shell">
    <!-- Top Navigation Bar -->
    <nav class="book-navbar">
      <!-- TOC button -->
      <button class="nav-btn" onclick="openToc()" title="Apri indice dei capitoli">
        <span>📑</span>
        <span>Indice</span>
      </button>

      <!-- Book Title -->
      <div class="nav-title">${escapeHtml(book.title)}</div>

      <!-- Right Controls: Font +/- & Theme -->
      <div style="display: flex; align-items: center; gap: 0.35rem;">
        <!-- Font sizing -->
        <div class="font-controls" title="Dimensione testo (A- / A+). Clicca su 15px per reimpostare.">
          <button class="font-btn" onclick="changeFontSize(-1)" title="Riduci font">A-</button>
          <div class="font-badge" id="font-badge" onclick="resetFontSize()" title="Clicca per ripristinare 15px">15px</div>
          <button class="font-btn" onclick="changeFontSize(1)" title="Ingrandisci font">A+</button>
        </div>

        <!-- Theme toggle button with visible label -->
        <button class="nav-btn" id="theme-btn" onclick="toggleTheme()" title="Cambia tema (Carta / Sepia / Notte)">
          <span id="theme-label">📜 Carta</span>
        </button>
      </div>
    </nav>

    <!-- Main Content Area: Fully isolated Iframe with full-height scroll -->
    <main class="book-frame-container">
      <iframe
        id="book-frame"
        sandbox="allow-scripts allow-forms allow-same-origin allow-modals allow-popups"
        title="Capitolo del libro"
      ></iframe>
    </main>

    <!-- Bottom Navigation Bar -->
    <footer class="book-footer">
      <button id="btn-prev" class="nav-btn" onclick="goPrev()">
        &larr; Precedente
      </button>

      <span class="page-indicator" id="page-counter">
        Pagina 1 di ${book.chapters.length}
      </span>

      <button id="btn-next" class="nav-btn" onclick="goNext()">
        Successiva &rarr;
      </button>
    </footer>
  </div>

  <!-- Slide-out Table of Contents Drawer -->
  <div class="toc-modal-backdrop" id="toc-backdrop" onclick="closeToc()"></div>
  <aside class="toc-drawer" id="toc-drawer">
    <div class="toc-header">
      <div style="display:flex; align-items:center; gap:0.4rem;">
        <h2>Indice</h2>
        <span class="toc-badge">${book.chapters.length} pagine</span>
      </div>
      <button class="toc-close-btn" onclick="closeToc()" title="Chiudi">&times;</button>
    </div>
    <ul class="toc-list" id="toc-list">
      ${tocItemsHtml}
    </ul>
  </aside>

  <script>
    const chaptersData = ${JSON.stringify(chapterDocsEncoded)};
    const chaptersMeta = ${JSON.stringify(chaptersMeta)};
    const totalChapters = chaptersMeta.length;
    let currentChapterIndex = 0;

    // Decode UTF-8 Base64
    function decodeUtf8Base64(str) {
      try {
        return decodeURIComponent(
          Array.prototype.map.call(atob(str), function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
          }).join('')
        );
      } catch(e) {
        return atob(str);
      }
    }

    // Font size controls
    let currentFontSize = 15;
    try {
      const savedFont = localStorage.getItem('paginaviva_font_size');
      if (savedFont && !isNaN(Number(savedFont))) {
        currentFontSize = Math.max(12, Math.min(22, Number(savedFont)));
      }
    } catch(e) {}

    function updateFontBadge() {
      const badge = document.getElementById('font-badge');
      if (badge) badge.innerText = currentFontSize + 'px';
    }

    function applyFontSizeToIframe() {
      try {
        const frame = document.getElementById('book-frame');
        if (frame && frame.contentDocument) {
          frame.contentDocument.documentElement.style.setProperty('--theme-size', currentFontSize + 'px');
          if (frame.contentDocument.body) {
            frame.contentDocument.body.style.fontSize = currentFontSize + 'px';
          }
        }
      } catch(e) {}
    }

    function changeFontSize(delta) {
      currentFontSize = Math.max(12, Math.min(22, currentFontSize + delta));
      updateFontBadge();
      applyFontSizeToIframe();
      try {
        localStorage.setItem('paginaviva_font_size', String(currentFontSize));
      } catch(e) {}
    }

    function resetFontSize() {
      currentFontSize = 15;
      updateFontBadge();
      applyFontSizeToIframe();
      try {
        localStorage.setItem('paginaviva_font_size', '15');
      } catch(e) {}
    }

    // Themes: Carta, Sepia, Notte
    const themes = [
      { id: 'paper', label: '📜 Carta' },
      { id: 'sepia', label: '🏺 Sepia' },
      { id: 'dark', label: '🌙 Notte' }
    ];
    let currentThemeIdx = 0;
    try {
      const savedTheme = localStorage.getItem('paginaviva_theme');
      if (savedTheme) {
        const idx = themes.findIndex(t => t.id === savedTheme);
        if (idx !== -1) currentThemeIdx = idx;
      }
    } catch(e) {}

    function applyTheme() {
      const t = themes[currentThemeIdx];
      document.documentElement.setAttribute('data-theme', t.id);
      document.body.setAttribute('data-theme', t.id);

      const label = document.getElementById('theme-label');
      if (label) label.textContent = t.label;

      try {
        const frame = document.getElementById('book-frame');
        if (frame && frame.contentDocument) {
          frame.contentDocument.documentElement.setAttribute('data-theme', t.id);
          if (frame.contentDocument.body) {
            frame.contentDocument.body.setAttribute('data-theme', t.id);
          }
        }
      } catch(e) {}

      try {
        localStorage.setItem('paginaviva_theme', t.id);
      } catch(e) {}
    }

    function toggleTheme() {
      currentThemeIdx = (currentThemeIdx + 1) % themes.length;
      applyTheme();
    }

    // Display Chapter in Iframe with complete fidelity
    function showChapter(index) {
      if (index < 0 || index >= totalChapters) return;
      currentChapterIndex = index;

      const frame = document.getElementById('book-frame');
      if (!frame) return;

      const htmlContent = decodeUtf8Base64(chaptersData[index]);

      // When iframe loads, re-sync font size and theme immediately
      frame.onload = function() {
        applyFontSizeToIframe();
        applyTheme();
      };

      frame.srcdoc = htmlContent;

      // Update TOC Active item
      for (let i = 0; i < totalChapters; i++) {
        const btn = document.getElementById('toc-btn-' + i);
        if (btn) {
          if (i === index) btn.classList.add('active');
          else btn.classList.remove('active');
        }
      }

      // Update Footer buttons & counter
      const counter = document.getElementById('page-counter');
      if (counter) {
        counter.innerText = 'Pagina ' + (index + 1) + ' di ' + totalChapters;
      }
      const prevBtn = document.getElementById('btn-prev');
      const nextBtn = document.getElementById('btn-next');
      if (prevBtn) prevBtn.style.visibility = index > 0 ? 'visible' : 'hidden';
      if (nextBtn) nextBtn.style.visibility = index < totalChapters - 1 ? 'visible' : 'hidden';

      closeToc();
    }

    function goPrev() {
      if (currentChapterIndex > 0) showChapter(currentChapterIndex - 1);
    }

    function goNext() {
      if (currentChapterIndex < totalChapters - 1) showChapter(currentChapterIndex + 1);
    }

    function openToc() {
      document.getElementById('toc-backdrop').classList.add('open');
      document.getElementById('toc-drawer').classList.add('open');
    }

    function closeToc() {
      document.getElementById('toc-backdrop').classList.remove('open');
      document.getElementById('toc-drawer').classList.remove('open');
    }

    // Comprehensive switchTab fallback: handles indexes, names, commands, and numbers
    window.switchTab = function(dest) {
      if (dest === 'toc') {
        openToc();
        return;
      }
      if (dest === 'next') {
        goNext();
        return;
      }
      if (dest === 'prev') {
        goPrev();
        return;
      }

      // Check numeric index or page number
      if (typeof dest === 'number' || (!isNaN(Number(dest)) && String(dest).trim() !== '')) {
        const num = Number(dest);
        if (num >= 1 && num <= totalChapters) {
          showChapter(num - 1);
          return;
        }
        if (num >= 0 && num < totalChapters) {
          showChapter(num);
          return;
        }
      }

      // Check string match with ID, Title, or original filename
      const q = String(dest).toLowerCase().trim();
      const match = chaptersMeta.find(function(c) {
        return c.id.toLowerCase() === q ||
               c.title.toLowerCase() === q ||
               c.title.toLowerCase().indexOf(q) !== -1 ||
               (c.originalFileName && c.originalFileName.toLowerCase().indexOf(q) !== -1);
      });

      if (match) {
        showChapter(match.index);
      }
    };

    // Listen to postMessage from iframe
    window.addEventListener('message', function(e) {
      const data = e.data;
      if (!data) return;
      if (data.type === 'PAGINAVIVA_NAVIGATE') {
        window.switchTab(data.destination || data.chapterId);
      } else if (data.type === 'PAGINAVIVA_ACTION') {
        if (data.action === 'next') goNext();
        else if (data.action === 'prev') goPrev();
        else if (data.action === 'toc') openToc();
      }
    });

    // Keyboard navigation
    window.addEventListener('keydown', function(e) {
      if (e.key === 'ArrowLeft') goPrev();
      else if (e.key === 'ArrowRight') goNext();
      else if (e.key === 'Escape') closeToc();
    });

    // Initialize
    updateFontBadge();
    applyTheme();
    showChapter(0);
  </script>
</body>
</html>`;
}

export function exportProjectJson(book: Book): string {
  return JSON.stringify(book, null, 2);
}

export async function exportZipBundle(book: Book): Promise<Blob> {
  const zip = new JSZip();

  // Standalone index.html
  const standaloneHtml = exportStandaloneHtmlBook(book);
  zip.file('index.html', standaloneHtml);

  // Individual chapters folder
  const chaptersFolder = zip.folder('capitoli');
  if (chaptersFolder) {
    book.chapters.forEach((ch, idx) => {
      const safe = ch.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const numPrefix = String(idx + 1).padStart(2, '0');
      chaptersFolder.file(`${numPrefix}_${safe}.html`, ch.rawHtml);
    });
  }

  zip.file('libro-progetto.json', exportProjectJson(book));

  const readme = `# ${book.title}\nAutore: ${book.author}\nPagine: ${book.chapters.length}\n\nApri index.html in qualsiasi browser su smartphone, tablet o PC per leggere il libro completo con indice dinamico.\n`;
  zip.file('LEGGIMI.txt', readme);

  return await zip.generateAsync({ type: 'blob' });
}
