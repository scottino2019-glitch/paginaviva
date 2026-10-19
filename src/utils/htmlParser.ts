import { DetectedHeading } from '../types/book';

export interface ParsedHtmlResult {
  title: string;
  subtitle?: string;
  wordCount: number;
  estimatedReadMinutes: number;
  hasInteractiveElements: boolean;
  interactiveDetails: string[];
  detectedHeadings: DetectedHeading[];
  sanitizedHtml: string;
}

export function parseHtmlContent(htmlString: string, fallbackFileName?: string): ParsedHtmlResult {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, 'text/html');

  // 1. Detect title
  let title = '';
  const titleTag = doc.querySelector('title');
  const h1Tag = doc.querySelector('h1');
  const h2Tag = doc.querySelector('h2');

  if (h1Tag && h1Tag.textContent?.trim()) {
    title = h1Tag.textContent.trim();
  } else if (titleTag && titleTag.textContent?.trim()) {
    title = titleTag.textContent.trim();
  } else if (h2Tag && h2Tag.textContent?.trim()) {
    title = h2Tag.textContent.trim();
  } else if (fallbackFileName) {
    title = fallbackFileName
      .replace(/\.html?$/i, '')
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  } else {
    title = 'Capitolo Senza Titolo';
  }

  // 2. Detect subtitle if any
  let subtitle: string | undefined;
  const subtitleEl = doc.querySelector('.subtitle, p.deck, p.lead, h2.subtitle');
  if (subtitleEl && subtitleEl.textContent?.trim()) {
    subtitle = subtitleEl.textContent.trim();
  } else if (h1Tag && h2Tag && h2Tag.textContent?.trim() && title === h1Tag.textContent.trim()) {
    // If h1 is title, h2 might be a subtitle
    const h2Text = h2Tag.textContent.trim();
    if (h2Text.length < 80) {
      subtitle = h2Text;
    }
  }

  // 3. Extract text content for word count
  // Remove script and style elements from clone for clean count
  const cloneDoc = doc.cloneNode(true) as Document;
  cloneDoc.querySelectorAll('script, style, noscript').forEach((el) => el.remove());
  const bodyText = cloneDoc.body ? cloneDoc.body.textContent || '' : '';
  const words = bodyText
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0);
  const wordCount = words.length;
  const estimatedReadMinutes = Math.max(1, Math.ceil(wordCount / 180));

  // 4. Detect Interactive Elements
  const interactiveDetails: string[] = [];
  const buttons = doc.querySelectorAll('button, input[type="button"], input[type="submit"]');
  const scripts = doc.querySelectorAll('script');
  const inputs = doc.querySelectorAll('input:not([type="hidden"]), select, textarea');
  const details = doc.querySelectorAll('details');
  const linksWithAnchors = doc.querySelectorAll('a[href^="#"], a[data-jump], [data-choice]');
  const mediaElements = doc.querySelectorAll('audio, video, canvas');

  if (buttons.length > 0) {
    interactiveDetails.push(`${buttons.length} pulsant${buttons.length > 1 ? 'i' : 'e'} interattiv${buttons.length > 1 ? 'i' : 'o'}`);
  }
  if (linksWithAnchors.length > 0) {
    interactiveDetails.push(`${linksWithAnchors.length} biv${linksWithAnchors.length > 1 ? 'i' : 'io'}/scelt${linksWithAnchors.length > 1 ? 'e' : 'a'}`);
  }
  if (inputs.length > 0) {
    interactiveDetails.push(`${inputs.length} camp${inputs.length > 1 ? 'i' : 'o'} interattiv${inputs.length > 1 ? 'i' : 'o'}`);
  }
  if (details.length > 0) {
    interactiveDetails.push(`${details.length} sezion${details.length > 1 ? 'i' : 'e'} a scomparsa`);
  }
  if (scripts.length > 0) {
    interactiveDetails.push(`${scripts.length} script di logica dinamica`);
  }
  if (mediaElements.length > 0) {
    interactiveDetails.push(`${mediaElements.length} element${mediaElements.length > 1 ? 'i' : 'o'} multimedial${mediaElements.length > 1 ? 'i' : 'e'}`);
  }

  const hasInteractiveElements = interactiveDetails.length > 0;

  // 5. Detect Headings for TOC sub-navigation
  const detectedHeadings: DetectedHeading[] = [];
  const headings = doc.querySelectorAll('h2, h3');
  headings.forEach((heading, idx) => {
    const text = heading.textContent?.trim() || '';
    if (text) {
      let id = heading.getAttribute('id');
      if (!id) {
        id = `heading-${idx + 1}-${text.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
        heading.setAttribute('id', id);
      }
      detectedHeadings.push({
        id,
        text,
        level: heading.tagName.toLowerCase() === 'h2' ? 2 : 3,
      });
    }
  });

  return {
    title,
    subtitle,
    wordCount,
    estimatedReadMinutes,
    hasInteractiveElements,
    interactiveDetails,
    detectedHeadings,
    sanitizedHtml: htmlString,
  };
}

/**
 * Builds the full isolated HTML document for rendering in an iframe.
 * Seamlessly integrates theme styling, typography, smooth scrolling,
 * and sets up postMessage bridge for chapter navigation.
 */
export function buildReaderDocument(
  chapterHtml: string,
  chapterId: string,
  theme: 'paper' | 'sepia' | 'dark' | 'clean',
  fontSize: 'sm' | 'base' | 'lg' | 'xl'
): string {
  // Theme color maps
  const themeStyles = {
    paper: {
      bg: '#FAF8F5',
      text: '#26221F',
      cardBg: '#FFFFFF',
      border: '#E8E2D9',
      accent: '#9A3412',
      accentHover: '#C2410C',
      font: "'Lora', Georgia, 'Times New Roman', serif",
    },
    sepia: {
      bg: '#F4ECD8',
      text: '#433422',
      cardBg: '#EFE5CE',
      border: '#DFD2B8',
      accent: '#854D0E',
      accentHover: '#A16207',
      font: "'Lora', Georgia, 'Times New Roman', serif",
    },
    dark: {
      bg: '#181716',
      text: '#E7E2DF',
      cardBg: '#232120',
      border: '#383533',
      accent: '#F59E0B',
      accentHover: '#FBBF24',
      font: "'Lora', Georgia, 'Times New Roman', serif",
    },
    clean: {
      bg: '#FFFFFF',
      text: '#1E293B',
      cardBg: '#F8FAFC',
      border: '#E2E8F0',
      accent: '#2563EB',
      accentHover: '#1D4ED8',
      font: "system-ui, -apple-system, sans-serif",
    },
  }[theme];

  const fontSizeMap = {
    sm: '13px',
    base: '15px',
    lg: '17px',
    xl: '19px',
  }[fontSize];

  const lineHeightMap = {
    sm: '1.6',
    base: '1.68',
    lg: '1.75',
    xl: '1.8',
  }[fontSize];

  return `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,400&family=Lora:ital,wght@0,400;0,500;0,600;1,400&family=Plus+Jakarta+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <style>
    :root {
      --reader-bg: ${themeStyles.bg};
      --reader-text: ${themeStyles.text};
      --reader-card: ${themeStyles.cardBg};
      --reader-border: ${themeStyles.border};
      --reader-accent: ${themeStyles.accent};
      --reader-accent-hover: ${themeStyles.accentHover};
      --reader-font: ${themeStyles.font};
      --reader-size: ${fontSizeMap};
      --reader-line-height: ${lineHeightMap};
    }

    * {
      box-sizing: border-box;
    }

    html, body {
      margin: 0;
      padding: 0;
      background-color: var(--reader-bg);
      color: var(--reader-text);
      font-family: var(--reader-font);
      font-size: var(--reader-size);
      line-height: var(--reader-line-height);
      text-rendering: optimizeLegibility;
      -webkit-font-smoothing: antialiased;
      transition: background-color 0.25s ease, color 0.25s ease;
      scroll-behavior: smooth;
    }

    .book-container {
      max-width: 680px;
      margin: 0 auto;
      padding: 1.25rem 1rem 3.5rem;
    }

    h1, h2, h3, h4, h5, h6 {
      font-family: 'Cormorant Garamond', Georgia, serif;
      font-weight: 600;
      line-height: 1.25;
      color: inherit;
      margin-top: 1.25rem;
      margin-bottom: 0.6rem;
    }

    h1 {
      font-size: 1.45rem;
      letter-spacing: -0.01em;
      border-bottom: 1px solid var(--reader-border);
      padding-bottom: 0.4rem;
      margin-top: 0.25rem;
    }

    h2 {
      font-size: 1.25rem;
      margin-top: 1.5rem;
    }

    h3 {
      font-size: 1.1rem;
    }

    p {
      margin-top: 0;
      margin-bottom: 1.35rem;
    }

    a {
      color: var(--reader-accent);
      text-decoration: underline;
      text-underline-offset: 3px;
      transition: color 0.15s ease;
      cursor: pointer;
    }

    a:hover {
      color: var(--reader-accent-hover);
    }

    /* Style interactive controls naturally within reader */
    button, .interactive-btn, .choice-btn {
      font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
      font-size: 0.95rem;
      font-weight: 500;
      padding: 0.65rem 1.25rem;
      border-radius: 8px;
      border: 1px solid var(--reader-border);
      background-color: var(--reader-card);
      color: var(--reader-text);
      cursor: pointer;
      transition: all 0.18s ease;
      margin: 0.4rem 0.4rem 0.4rem 0;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    }

    button:hover, .interactive-btn:hover, .choice-btn:hover {
      border-color: var(--reader-accent);
      color: var(--reader-accent);
      transform: translateY(-1px);
      box-shadow: 0 3px 8px rgba(0,0,0,0.08);
    }

    button:active, .interactive-btn:active, .choice-btn:active {
      transform: translateY(0);
    }

    input[type="text"], input[type="number"], select, textarea {
      font-family: inherit;
      font-size: 0.95rem;
      padding: 0.6rem 0.9rem;
      border-radius: 6px;
      border: 1px solid var(--reader-border);
      background-color: var(--reader-card);
      color: var(--reader-text);
      margin: 0.25rem 0;
    }

    input:focus, select:focus, textarea:focus {
      outline: 2px solid var(--reader-accent);
      outline-offset: 1px;
    }

    details {
      background-color: var(--reader-card);
      border: 1px solid var(--reader-border);
      border-radius: 8px;
      padding: 0.85rem 1.25rem;
      margin: 1.25rem 0;
    }

    summary {
      font-weight: 600;
      cursor: pointer;
      color: var(--reader-accent);
      user-select: none;
    }

    blockquote {
      border-left: 3px solid var(--reader-border);
      margin: 1.5rem 0;
      padding-left: 1.25rem;
      font-style: italic;
      opacity: 0.9;
    }

    pre, code {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.9em;
    }

    pre {
      background: var(--reader-card);
      border: 1px solid var(--reader-border);
      border-radius: 8px;
      padding: 1rem;
      overflow-x: auto;
    }

    img {
      max-width: 100%;
      height: auto;
      border-radius: 6px;
      margin: 1.5rem 0;
    }

    .choice-group {
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
      margin: 1.75rem 0;
      padding: 1.25rem;
      background-color: var(--reader-card);
      border: 1px solid var(--reader-border);
      border-radius: 10px;
    }

    .choice-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.85rem 1.15rem;
      border-radius: 8px;
      border: 1px solid var(--reader-border);
      background-color: var(--reader-bg);
      text-decoration: none;
      color: var(--reader-text);
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .choice-item:hover {
      border-color: var(--reader-accent);
      color: var(--reader-accent);
      padding-left: 1.35rem;
    }

    .interactive-card {
      background-color: var(--reader-card);
      border: 1px solid var(--reader-border);
      border-radius: 10px;
      padding: 1.25rem;
      margin: 1.5rem 0;
    }
  </style>
</head>
<body>
  <div class="book-container" id="chapter-content">
    ${chapterHtml}
  </div>

  <script>
    // Bridge navigation requests to parent reader
    document.addEventListener('click', function(e) {
      // Find closest link or interactive button
      const target = e.target.closest('a, button, [data-jump-chapter], [data-choice]');
      if (!target) return;

      // 1. Check data-jump-chapter attribute
      const jumpId = target.getAttribute('data-jump-chapter');
      if (jumpId) {
        e.preventDefault();
        window.parent.postMessage({ type: 'PAGINAVIVA_NAVIGATE', chapterId: jumpId }, '*');
        return;
      }

      // 2. Check href anchor matching chapter IDs or links
      const href = target.getAttribute('href');
      if (href && href.startsWith('#')) {
        const targetId = href.substring(1);
        // If element exists on page, smooth scroll to it
        const el = document.getElementById(targetId);
        if (el) {
          e.preventDefault();
          el.scrollIntoView({ behavior: 'smooth' });
        } else {
          // If not on current page, it might be a chapter reference (e.g. #capitolo-2)
          e.preventDefault();
          window.parent.postMessage({ type: 'PAGINAVIVA_NAVIGATE_REF', ref: targetId }, '*');
        }
      }
    });

    // Notify parent of scroll progress
    window.addEventListener('scroll', function() {
      const scrollTotal = document.documentElement.scrollHeight - window.innerHeight;
      const progress = scrollTotal > 0 ? (window.scrollY / scrollTotal) * 100 : 0;
      window.parent.postMessage({ type: 'PAGINAVIVA_SCROLL', progress: Math.min(100, Math.max(0, progress)), chapterId: '${chapterId}' }, '*');
    }, { passive: true });
  </script>
</body>
</html>`;
}
