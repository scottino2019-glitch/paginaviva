import { Book } from '../types/book';
import { parseHtmlContent } from '../utils/htmlParser';

const page1Html = `
<h1>Benvenuto nel tuo Libro Interattivo</h1>
<p class="subtitle" style="font-size: 1.1rem; color: #78716c; margin-bottom: 1.5rem;">
  Questa è una pagina di prova. Puoi sostituirla, eliminarla o caricare direttamente i tuoi file HTML.
</p>

<p>
  Ogni file HTML che carichi diventa una <strong>pagina</strong> o un <strong>capitolo</strong> del tuo libro.
  Tutti gli elementi interattivi (scelte a bivi, pulsanti, script, stili, caselle e suoni) continuano a funzionare!
</p>

<div class="interactive-card" style="background: #fff; border: 1px solid #e7e5e4; border-radius: 8px; padding: 1.25rem; margin: 1.5rem 0;">
  <h3 style="margin-top: 0; font-size: 1.1rem;">Esempio di scelta interattiva:</h3>
  <p style="margin-bottom: 1rem; font-size: 0.95rem;">
    Clicca sul pulsante qui sotto per verificare come i pulsanti HTML interagiscono con il lettore:
  </p>
  <button onclick="document.getElementById('demo-feedback').style.display = 'block';" class="choice-btn" style="cursor: pointer; padding: 0.6rem 1.2rem; background: #9a3412; color: #fff; border: none; border-radius: 6px; font-weight: 500;">
    👉 Clicca qui per provare l'interazione
  </button>
  <div id="demo-feedback" style="display: none; margin-top: 1rem; padding: 0.75rem; background: #f0fdf4; border: 1px solid #bbf7d0; color: #166534; border-radius: 6px; font-size: 0.9rem;">
    ✅ Funziona! I tuoi script e stili HTML sono pienamente attivi.
  </div>
</div>
`;

const page2Html = `
<h1>Istruzioni per Organizzare l'Indice</h1>
<p class="subtitle" style="font-size: 1.1rem; color: #78716c; margin-bottom: 1.5rem;">
  Come ordinare le pagine e creare capitoli o sotto-sezioni.
</p>

<p>
  Nella colonna a sinistra trovi l'<strong>Indice del Libro</strong>. Per ogni pagina puoi:
</p>

<ul style="line-height: 1.8; margin-bottom: 1.5rem;">
  <li><strong>Spostare Su o Giù</strong> le pagine usando i pulsanti freccia (l'indice si rinumera da solo).</li>
  <li><strong>Creare sotto-pagine</strong> con il tasto freccia a destra (per esempio: Capitolo 1 &rarr; Pagina 1.1).</li>
  <li><strong>Caricare i tuoi file HTML</strong> cliccando sul pulsante arancione in alto a destra.</li>
  <li><strong>Rinominare il titolo</strong> direttamente con un click.</li>
</ul>

<div class="interactive-card" style="background: #fff; border: 1px solid #e7e5e4; border-radius: 8px; padding: 1.25rem; margin: 1.5rem 0;">
  <p style="margin: 0; font-size: 0.95rem;">
    💡 <em>Suggerimento: Clicca su <strong>"Svuota e Inizia da Zero"</strong> nella barra in alto se vuoi rimuovere queste due pagine di esempio e inserire subito i tuoi file HTML.</em>
  </p>
</div>
`;

export function createCleanEmptyBook(): Book {
  return {
    id: `book-${Date.now()}`,
    title: 'Il Mio Libro Interattivo',
    subtitle: 'Composto da file HTML',
    author: 'Autore',
    description: 'Libro creato con file HTML di testo interattivo',
    language: 'it',
    chapters: [],
    settings: {
      numberingStyle: 'arabic',
      defaultReaderTheme: 'paper',
      fontSize: 'base',
      showReadingTime: true,
      enableCrossChapterLinks: true,
      customPrefix: 'Capitolo',
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export function createDefaultBook(): Book {
  const p1 = parseHtmlContent(page1Html);
  const p2 = parseHtmlContent(page2Html);

  const chapters = [
    {
      id: 'page-1',
      title: 'Benvenuto nel tuo Libro Interattivo',
      subtitle: 'Pagina iniziale di prova',
      rawHtml: page1Html,
      order: 0,
      level: 1 as const,
      type: 'chapter' as const,
      wordCount: p1.wordCount,
      estimatedReadMinutes: p1.estimatedReadMinutes,
      hasInteractiveElements: true,
      interactiveDetails: ['1 pulsante interattivo', 'script di prova'],
      detectedHeadings: [],
      originalFileName: 'benvenuto.html',
    },
    {
      id: 'page-2',
      title: 'Come Organizzare le Pagine e l\'Indice',
      subtitle: 'Guida rapida ai comandi',
      rawHtml: page2Html,
      order: 1,
      level: 1 as const,
      type: 'chapter' as const,
      wordCount: p2.wordCount,
      estimatedReadMinutes: p2.estimatedReadMinutes,
      hasInteractiveElements: false,
      interactiveDetails: [],
      detectedHeadings: [],
      originalFileName: 'guida.html',
    },
  ];

  return {
    id: 'book-mio-progetto',
    title: 'Il Mio Libro Interattivo',
    subtitle: 'Organizza i tuoi file HTML in capitoli e pagine',
    author: 'Autore',
    description: 'Raccolta di file HTML interattivi con indice dinamico',
    language: 'it',
    chapters,
    settings: {
      numberingStyle: 'arabic',
      defaultReaderTheme: 'paper',
      fontSize: 'base',
      showReadingTime: true,
      enableCrossChapterLinks: true,
      customPrefix: 'Capitolo',
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}
