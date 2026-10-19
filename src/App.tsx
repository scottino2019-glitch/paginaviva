import React, { useState, useEffect } from 'react';
import { Book, Chapter } from './types/book';
import { createDefaultBook, createCleanEmptyBook } from './data/defaultBook';
import { exportStandaloneHtmlBook, buildChapterDocument } from './utils/exporter';
import { formatChapterNumber } from './utils/romanNumerals';
import { parseHtmlContent } from './utils/htmlParser';
import { HtmlUploader } from './components/HtmlUploader';
import {
  Upload,
  Download,
  Trash2,
  ArrowUp,
  ArrowDown,
  ArrowRight,
  ArrowLeft,
  Plus,
  Eye,
  X,
  FileCode,
  Layers,
  Check,
  AlertTriangle
} from 'lucide-react';

const STORAGE_KEY = 'paginaviva_book_v5';

export default function App() {
  const [book, setBook] = useState<Book>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.chapters && Array.isArray(parsed.chapters)) {
          return parsed;
        }
      }
    } catch {
      // Fallback
    }
    return createDefaultBook();
  });

  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [previewChapterId, setPreviewChapterId] = useState<string | null>(null);
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [downloadNotice, setDownloadNotice] = useState<string | null>(null);
  const [deletedUndo, setDeletedUndo] = useState<{ chapter: Chapter; index: number } | null>(null);

  // Global switchTab listener and fallback
  useEffect(() => {
    const handleSwitchTab = (e: any) => {
      const tab = e?.detail;
      if (tab === 'upload') setIsUploadOpen(true);
      else if (tab === 'download' || tab === 'export') handleDownload();
      else if (typeof tab === 'string') {
        const found = book.chapters.find((c) => c.id === tab || c.title.toLowerCase().includes(tab.toLowerCase()));
        if (found) setPreviewChapterId(found.id);
      }
    };

    window.addEventListener('paginaviva:switchTab', handleSwitchTab);

    (window as any).switchTab = (tab: any) => {
      if (tab === 'upload') setIsUploadOpen(true);
      else if (tab === 'download' || tab === 'export') handleDownload();
      else if (typeof tab === 'string') {
        const found = book.chapters.find((c) => c.id === tab || c.title.toLowerCase().includes(tab.toLowerCase()));
        if (found) setPreviewChapterId(found.id);
      }
    };

    return () => {
      window.removeEventListener('paginaviva:switchTab', handleSwitchTab);
    };
  }, [book.chapters]);

  // Auto-save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(book));
    } catch (e) {
      console.warn('Errore salvataggio:', e);
    }
  }, [book]);

  // Reorder chapter up/down
  const moveChapter = (index: number, direction: 'up' | 'down') => {
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= book.chapters.length) return;

    const list = [...book.chapters];
    const item = list[index];
    list[index] = list[target];
    list[target] = item;

    const reordered = list.map((c, i) => ({ ...c, order: i }));
    setBook({ ...book, chapters: reordered, updatedAt: Date.now() });
  };

  // Toggle sub-page level
  const toggleSubpage = (index: number) => {
    const ch = book.chapters[index];
    const newLevel = ch.level === 1 ? 2 : 1;
    const list = [...book.chapters];
    list[index] = { ...ch, level: newLevel };
    setBook({ ...book, chapters: list, updatedAt: Date.now() });
  };

  // INSTANT DELETE (Zero window.confirm, zero blocks!)
  const deleteChapter = (chapterId: string) => {
    const index = book.chapters.findIndex((c) => c.id === chapterId);
    if (index === -1) return;

    const deletedItem = book.chapters[index];
    const list = book.chapters.filter((c) => c.id !== chapterId).map((c, i) => ({ ...c, order: i }));

    setDeletedUndo({ chapter: deletedItem, index });
    setBook({ ...book, chapters: list, updatedAt: Date.now() });
    if (previewChapterId === chapterId) setPreviewChapterId(null);
  };

  // Undo delete
  const undoDelete = () => {
    if (!deletedUndo) return;
    const list = [...book.chapters];
    list.splice(deletedUndo.index, 0, deletedUndo.chapter);
    const reordered = list.map((c, i) => ({ ...c, order: i }));
    setBook({ ...book, chapters: reordered, updatedAt: Date.now() });
    setDeletedUndo(null);
  };

  // Direct title edit
  const updateChapterTitle = (id: string, text: string) => {
    const list = book.chapters.map((c) => (c.id === id ? { ...c, title: text } : c));
    setBook({ ...book, chapters: list, updatedAt: Date.now() });
  };

  // Add blank page
  const addBlankPage = () => {
    const newPage: Chapter = {
      id: `page-${Date.now()}`,
      title: `Nuova Pagina ${book.chapters.length + 1}`,
      rawHtml: `<h1>Nuova Pagina</h1>\n<p>Inserisci qui il testo o i pulsanti interattivi...</p>`,
      order: book.chapters.length,
      level: 1,
      type: 'chapter',
      wordCount: 10,
      estimatedReadMinutes: 1,
      hasInteractiveElements: false,
      interactiveDetails: [],
      detectedHeadings: [],
      originalFileName: 'pagina.html',
    };
    const list = [...book.chapters, newPage].map((c, i) => ({ ...c, order: i }));
    setBook({ ...book, chapters: list, updatedAt: Date.now() });
  };

  // Add uploaded chapters
  const handleAddChapters = (newChapters: Chapter[]) => {
    const list = [...book.chapters, ...newChapters].map((c, i) => ({ ...c, order: i }));
    setBook({ ...book, chapters: list, updatedAt: Date.now() });
  };

  // Svuota tutto e inizia da zero
  const handleResetEmpty = () => {
    const empty = createCleanEmptyBook();
    setBook(empty);
    setPreviewChapterId(null);
    setShowConfirmReset(false);
  };

  // Instant Download of standalone HTML book
  const handleDownload = () => {
    if (book.chapters.length === 0) {
      setDownloadNotice('Aggiungi almeno una pagina o capitolo prima di scaricare il libro.');
      setTimeout(() => setDownloadNotice(null), 4000);
      return;
    }
    const html = exportStandaloneHtmlBook(book);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const safe = (book.title || 'mio-libro-interattivo').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    a.download = `${safe}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3500);
  };

  const previewChapter = book.chapters.find((c) => c.id === previewChapterId);

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900 flex flex-col font-sans pb-16 antialiased">
      {/* 1. Header superiore fisso e compatto */}
      <header className="sticky top-0 z-40 bg-stone-900 border-b-2 border-amber-500 text-white shadow-md">
        <div className="max-w-3xl mx-auto px-3 py-2 flex items-center justify-between gap-2">
          {/* Logo */}
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-serif font-black text-xl text-amber-400 whitespace-nowrap">
              PaginaViva
            </span>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => setIsUploadOpen(true)}
              className="px-3 py-2 text-xs font-black uppercase tracking-wider text-stone-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow flex items-center gap-1.5 cursor-pointer min-h-[40px] border border-amber-300"
            >
              <Upload className="w-4 h-4 stroke-[2.5]" />
              <span>Carica HTML</span>
            </button>

            <button
              onClick={handleDownload}
              className="px-3 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-600 rounded-lg shadow flex items-center gap-1.5 cursor-pointer min-h-[40px]"
              title="Scarica libro completo"
            >
              {downloadSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-200" />
                  <span>Scaricato!</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Scarica</span>
                </>
              )}
            </button>

            <button
              onClick={() => setShowConfirmReset(true)}
              className="p-2 text-stone-400 hover:text-red-400 hover:bg-stone-800 rounded-lg transition-colors cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center"
              title="Svuota tutto"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* 2. Main Content - Standard fluid vertical scroll */}
      <main className="max-w-2xl w-full mx-auto px-3 py-4 space-y-4">
        {/* Notice banner */}
        {downloadNotice && (
          <div className="bg-amber-100 border-2 border-amber-400 text-amber-950 p-3 rounded-xl flex items-center justify-between text-xs shadow-md">
            <span>{downloadNotice}</span>
            <button
              onClick={() => setDownloadNotice(null)}
              className="text-amber-800 hover:text-amber-950 font-bold p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Undo notification if a page was deleted */}
        {deletedUndo && (
          <div className="bg-stone-900 text-white p-3 rounded-xl flex items-center justify-between text-xs shadow-lg">
            <span className="truncate mr-2">
              Pagina <strong>"{deletedUndo.chapter.title}"</strong> eliminata.
            </span>
            <button
              onClick={undoDelete}
              className="text-amber-400 font-extrabold underline shrink-0 px-2 py-1"
            >
              Annulla eliminazione
            </button>
          </div>
        )}

        {/* Book Title Banner */}
        <div className="bg-white border-2 border-stone-200 rounded-2xl p-4 shadow-xs space-y-2">
          <label className="text-[11px] font-bold uppercase tracking-wider text-stone-500 block">
            Titolo del tuo Libro
          </label>
          <input
            type="text"
            value={book.title}
            onChange={(e) => setBook({ ...book, title: e.target.value, updatedAt: Date.now() })}
            placeholder="Scrivi il titolo del libro..."
            className="w-full font-serif font-black text-lg sm:text-xl text-stone-900 bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 focus:border-amber-600 focus:outline-none"
          />
        </div>

        {/* Chapter List Card */}
        <div className="bg-white border-2 border-stone-200 rounded-2xl p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <Layers className="w-5 h-5 text-amber-700" />
              <h2 className="font-serif font-bold text-base text-stone-900">
                Organizza i Capitoli / Pagine
              </h2>
              <span className="text-xs font-bold bg-stone-200 text-stone-800 px-2 py-0.5 rounded-full">
                {book.chapters.length}
              </span>
            </div>

            {/* Quick format selector */}
            <select
              value={book.settings.numberingStyle}
              onChange={(e) =>
                setBook({
                  ...book,
                  settings: { ...book.settings, numberingStyle: e.target.value as any },
                  updatedAt: Date.now(),
                })
              }
              className="bg-stone-100 border border-stone-300 rounded-lg px-2 py-1 text-xs font-bold text-stone-800"
            >
              <option value="arabic">1, 2, 3</option>
              <option value="roman">Capitolo I, II</option>
              <option value="none">Senza numeri</option>
            </select>
          </div>

          <p className="text-xs text-stone-500">
            Usa le frecce <strong>▲</strong> e <strong>▼</strong> per spostare i capitoli nell'ordine desiderato.
          </p>

          {/* Buttons: Carica HTML & Nuova Pagina */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={() => setIsUploadOpen(true)}
              className="w-full py-3 px-3 text-xs font-black uppercase tracking-wider text-stone-950 bg-amber-400 hover:bg-amber-300 active:scale-95 rounded-xl shadow border-2 border-amber-500 flex items-center justify-center gap-2 cursor-pointer min-h-[48px]"
            >
              <Upload className="w-4 h-4 stroke-[3]" />
              <span>Carica File HTML</span>
            </button>

            <button
              onClick={addBlankPage}
              className="w-full py-3 px-3 text-xs font-bold text-stone-800 bg-stone-100 hover:bg-stone-200 active:scale-95 rounded-xl border border-stone-300 flex items-center justify-center gap-1.5 cursor-pointer min-h-[48px]"
            >
              <Plus className="w-4 h-4 text-amber-700" />
              <span>Nuova Pagina</span>
            </button>
          </div>
        </div>

        {/* Chapters Cards */}
        {book.chapters.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-stone-300 rounded-2xl p-8 text-center space-y-4">
            <FileCode className="w-12 h-12 mx-auto text-amber-600" />
            <div>
              <h3 className="font-serif font-bold text-lg text-stone-900">
                Nessun capitolo presente
              </h3>
              <p className="text-xs text-stone-600 mt-1">
                Tocca il pulsante qui sotto per caricare i tuoi file HTML.
              </p>
            </div>
            <button
              onClick={() => setIsUploadOpen(true)}
              className="w-full py-3 text-xs font-black uppercase text-stone-950 bg-amber-400 hover:bg-amber-300 rounded-xl shadow border-2 border-amber-500 flex items-center justify-center gap-2 min-h-[48px]"
            >
              <Upload className="w-4 h-4" />
              <span>Carica i tuoi file HTML</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {book.chapters.map((chapter, index) => {
              const isFirst = index === 0;
              const isLast = index === book.chapters.length - 1;

              const seqIdx = book.chapters.slice(0, index + 1).filter((c) => c.type === chapter.type).length;
              const dynamicNumber = formatChapterNumber(
                chapter,
                seqIdx,
                book.settings.numberingStyle,
                book.settings.customPrefix
              );

              return (
                <div
                  key={chapter.id}
                  style={{ marginLeft: chapter.level === 2 ? '1.25rem' : '0' }}
                  className="bg-white border-2 border-stone-200 rounded-2xl p-3.5 shadow-xs space-y-2.5"
                >
                  {/* Top row: Number, Title, and Preview button */}
                  <div className="flex items-center gap-2">
                    <span className="font-serif font-black text-sm text-amber-950 bg-amber-100 border border-amber-300 rounded-lg px-2 py-1 shrink-0 min-w-7 text-center">
                      {dynamicNumber || index + 1}
                    </span>

                    <input
                      type="text"
                      value={chapter.title}
                      onChange={(e) => updateChapterTitle(chapter.id, e.target.value)}
                      className="font-serif font-bold text-sm text-stone-900 bg-stone-50 border border-stone-200 focus:border-amber-600 rounded-lg px-2.5 py-1.5 flex-1 min-w-0 focus:outline-none"
                      placeholder="Titolo capitolo..."
                    />

                    <button
                      onClick={() => setPreviewChapterId(previewChapterId === chapter.id ? null : chapter.id)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1 shrink-0 min-h-[38px] cursor-pointer transition-colors ${
                        previewChapterId === chapter.id
                          ? 'bg-amber-600 text-white'
                          : 'bg-stone-100 text-stone-800 hover:bg-stone-200'
                      }`}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>{previewChapterId === chapter.id ? 'Chiudi' : 'Anteprima'}</span>
                    </button>
                  </div>

                  {/* Actions row: Move, Indent, Delete */}
                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-stone-100 text-xs">
                    <span className="text-[11px] text-stone-500 font-mono truncate max-w-[150px]">
                      {chapter.originalFileName || 'pagina.html'}
                      {chapter.level === 2 && ' (↳ Sotto-sezione)'}
                    </span>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Sposta Su */}
                      <button
                        onClick={() => moveChapter(index, 'up')}
                        disabled={isFirst}
                        title="Sposta prima"
                        className="p-2 text-stone-700 bg-stone-100 hover:bg-stone-200 disabled:opacity-20 rounded-lg min-h-[42px] min-w-[42px] flex items-center justify-center cursor-pointer"
                      >
                        <ArrowUp className="w-4 h-4 stroke-[2.5]" />
                      </button>

                      {/* Sposta Giù */}
                      <button
                        onClick={() => moveChapter(index, 'down')}
                        disabled={isLast}
                        title="Sposta dopo"
                        className="p-2 text-stone-700 bg-stone-100 hover:bg-stone-200 disabled:opacity-20 rounded-lg min-h-[42px] min-w-[42px] flex items-center justify-center cursor-pointer"
                      >
                        <ArrowDown className="w-4 h-4 stroke-[2.5]" />
                      </button>

                      {/* Rientro */}
                      <button
                        onClick={() => toggleSubpage(index)}
                        title={chapter.level === 1 ? 'Annida come sotto-sezione' : 'Riporta a livello principale'}
                        className={`p-2 rounded-lg min-h-[42px] min-w-[42px] flex items-center justify-center cursor-pointer ${
                          chapter.level === 2
                            ? 'bg-amber-100 text-amber-900 font-bold border border-amber-300'
                            : 'bg-stone-100 text-stone-700'
                        }`}
                      >
                        {chapter.level === 1 ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
                      </button>

                      {/* ELIMINA ISTANTANEO */}
                      <button
                        onClick={() => deleteChapter(chapter.id)}
                        title="Elimina"
                        className="p-2 text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg min-h-[42px] min-w-[42px] flex items-center justify-center cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4 stroke-[2.5]" />
                      </button>
                    </div>
                  </div>

                  {/* Inline Preview if expanded */}
                  {previewChapterId === chapter.id && (
                    <div className="pt-3 border-t-2 border-amber-400">
                      <div className="bg-[#FAF8F5] border-2 border-amber-500/80 rounded-2xl overflow-hidden shadow-xl">
                        {/* Preview Topbar */}
                        <div className="bg-stone-900 text-white px-3.5 py-2.5 flex items-center justify-between text-xs font-bold border-b border-stone-700">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0"></span>
                            <span className="text-amber-300 truncate">
                              Anteprima: {chapter.title}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[11px] text-stone-300 hidden sm:inline font-mono">
                              (Scorri verso il basso per leggere tutto)
                            </span>
                            <button
                              onClick={() => setPreviewChapterId(null)}
                              className="text-stone-300 hover:text-white bg-stone-800 hover:bg-stone-700 p-1 rounded-md cursor-pointer"
                              title="Chiudi anteprima"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Full height scrollable iframe */}
                        <iframe
                          srcDoc={buildChapterDocument(chapter, book, dynamicNumber)}
                          className="w-full h-[520px] max-h-[75vh] border-0 bg-transparent block"
                          sandbox="allow-scripts allow-forms allow-same-origin allow-modals allow-popups"
                          title={chapter.title}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Big Bottom Action: Download Completed HTML Book */}
        {book.chapters.length > 0 && (
          <div className="pt-4">
            <button
              onClick={handleDownload}
              className="w-full py-4 px-4 text-sm font-black uppercase tracking-wider text-white bg-emerald-700 hover:bg-emerald-600 active:scale-98 rounded-2xl shadow-xl flex items-center justify-center gap-2 cursor-pointer border-2 border-emerald-500 min-h-[52px]"
            >
              <Download className="w-5 h-5" />
              <span>Scarica Libro HTML Completo (.html)</span>
            </button>
            <p className="text-center text-xs text-stone-500 mt-2">
              Il file scaricato si apre in qualsiasi browser su cellulare, tablet o PC con l'indice dinamico funzionante.
            </p>
          </div>
        )}
      </main>

      {/* Upload Modal */}
      <HtmlUploader
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onAddChapters={handleAddChapters}
        existingChapterCount={book.chapters.length}
      />

      {/* Svuota Tutto Modal (In-app, no window.confirm) */}
      {showConfirmReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full shadow-2xl text-stone-900 space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold">Vuoi svuotare il libro?</h3>
            </div>
            <p className="text-xs text-stone-600">
              Tutte le pagine caricate verranno rimosse per permetterti di iniziare da zero.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowConfirmReset(false)}
                className="px-3 py-2 text-xs font-semibold text-stone-700 bg-stone-100 rounded-lg min-h-[44px]"
              >
                Annulla
              </button>
              <button
                onClick={handleResetEmpty}
                className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg min-h-[44px]"
              >
                Sì, Svuota Tutto
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
