import React, { useState, useMemo } from 'react';
import { Book, Chapter, NumberingStyle } from '../types/book';
import { formatChapterNumber } from '../utils/romanNumerals';
import { buildReaderDocument, parseHtmlContent } from '../utils/htmlParser';
import {
  ArrowUp,
  ArrowDown,
  Trash2,
  Plus,
  Upload,
  Eye,
  Code2,
  Save,
  BookOpen,
  FileCode,
  Layers,
  Sparkles,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';

interface BookStudioProps {
  book: Book;
  selectedChapterId: string;
  onSelectChapter: (id: string) => void;
  onUpdateBook: (updated: Book) => void;
  onOpenUpload: () => void;
  onOpenSettings: () => void;
  onNavigateToReader: (chapterId: string) => void;
}

export const BookStudio: React.FC<BookStudioProps> = ({
  book,
  selectedChapterId,
  onSelectChapter,
  onUpdateBook,
  onOpenUpload,
  onNavigateToReader,
}) => {
  const [rightTab, setRightTab] = useState<'preview' | 'code'>('preview');

  // Currently selected page
  const currentChapter = book.chapters.find((c) => c.id === selectedChapterId) || book.chapters[0];
  const [editedHtml, setEditedHtml] = useState(currentChapter ? currentChapter.rawHtml : '');
  const [hasHtmlChanges, setHasHtmlChanges] = useState(false);
  const [lastDeletedChapter, setLastDeletedChapter] = useState<{ chapter: Chapter; index: number } | null>(null);

  // Sync editedHtml when currentChapter changes
  React.useEffect(() => {
    if (currentChapter) {
      setEditedHtml(currentChapter.rawHtml);
      setHasHtmlChanges(false);
    }
  }, [currentChapter?.id]);

  // Live reader document
  const previewHtml = useMemo(() => {
    if (!currentChapter) return '';
    return buildReaderDocument(
      hasHtmlChanges ? editedHtml : currentChapter.rawHtml,
      currentChapter.id,
      book.settings.defaultReaderTheme || 'paper',
      book.settings.fontSize || 'base'
    );
  }, [currentChapter, editedHtml, hasHtmlChanges, book.settings]);

  // Reordering: move page up/down
  const moveChapter = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= book.chapters.length) return;

    const newChapters = [...book.chapters];
    const item = newChapters[index];
    newChapters[index] = newChapters[targetIndex];
    newChapters[targetIndex] = item;

    const reordered = newChapters.map((c, i) => ({ ...c, order: i }));
    onUpdateBook({ ...book, chapters: reordered, updatedAt: Date.now() });
  };

  // Hierarchy level: make subpage or promote
  const toggleSubpage = (index: number) => {
    const ch = book.chapters[index];
    const newLevel = ch.level === 1 ? 2 : 1;
    const newChapters = [...book.chapters];
    newChapters[index] = { ...ch, level: newLevel };
    onUpdateBook({ ...book, chapters: newChapters, updatedAt: Date.now() });
  };

  // DIRECT RELIABLE DELETE: Zero window.confirm blocks!
  const deleteChapter = (chapterId: string) => {
    const index = book.chapters.findIndex((c) => c.id === chapterId);
    if (index === -1) return;

    const deletedItem = book.chapters[index];
    const newChapters = book.chapters.filter((c) => c.id !== chapterId).map((c, i) => ({ ...c, order: i }));

    setLastDeletedChapter({ chapter: deletedItem, index });
    onUpdateBook({ ...book, chapters: newChapters, updatedAt: Date.now() });

    if (selectedChapterId === chapterId) {
      const nextId = newChapters[index]?.id || newChapters[index - 1]?.id || '';
      onSelectChapter(nextId);
    }
  };

  // Undo delete
  const undoDelete = () => {
    if (!lastDeletedChapter) return;
    const newChapters = [...book.chapters];
    newChapters.splice(lastDeletedChapter.index, 0, lastDeletedChapter.chapter);
    const reordered = newChapters.map((c, i) => ({ ...c, order: i }));
    onUpdateBook({ ...book, chapters: reordered, updatedAt: Date.now() });
    onSelectChapter(lastDeletedChapter.chapter.id);
    setLastDeletedChapter(null);
  };

  // Add blank page
  const addBlankPage = () => {
    const newPageHtml = `<h1>Nuova Pagina</h1>\n<p>Inserisci qui il tuo testo o pulsanti interattivi...</p>`;
    const parsed = parseHtmlContent(newPageHtml);
    const newChapter: Chapter = {
      id: `page-${Date.now()}`,
      title: `Pagina ${book.chapters.length + 1}`,
      rawHtml: newPageHtml,
      order: book.chapters.length,
      level: 1,
      type: 'chapter',
      wordCount: parsed.wordCount,
      estimatedReadMinutes: parsed.estimatedReadMinutes,
      hasInteractiveElements: false,
      interactiveDetails: [],
      detectedHeadings: [],
      originalFileName: 'nuova-pagina.html',
    };

    const newChapters = [...book.chapters, newChapter].map((c, i) => ({ ...c, order: i }));
    onUpdateBook({ ...book, chapters: newChapters, updatedAt: Date.now() });
    onSelectChapter(newChapter.id);
  };

  // Direct title update
  const updateTitle = (chapterId: string, newTitle: string) => {
    const newChapters = book.chapters.map((c) =>
      c.id === chapterId ? { ...c, title: newTitle } : c
    );
    onUpdateBook({ ...book, chapters: newChapters, updatedAt: Date.now() });
  };

  // Save edited HTML
  const saveEditedHtml = () => {
    if (!currentChapter) return;
    const analysis = parseHtmlContent(editedHtml);
    const updated: Chapter = {
      ...currentChapter,
      rawHtml: editedHtml,
      wordCount: analysis.wordCount,
      estimatedReadMinutes: analysis.estimatedReadMinutes,
      hasInteractiveElements: analysis.hasInteractiveElements,
      interactiveDetails: analysis.interactiveDetails,
    };
    const newChapters = book.chapters.map((c) => (c.id === updated.id ? updated : c));
    onUpdateBook({ ...book, chapters: newChapters, updatedAt: Date.now() });
    setHasHtmlChanges(false);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-stone-100">
      {/* Toast message if a page was just deleted */}
      {lastDeletedChapter && (
        <div className="bg-stone-900 text-white px-4 py-2.5 text-xs flex items-center justify-between border-b border-stone-700 animate-fade-in shadow-md">
          <span>
            Pagina <strong>"{lastDeletedChapter.chapter.title}"</strong> eliminata.
          </span>
          <button
            onClick={undoDelete}
            className="text-amber-400 hover:text-amber-300 font-bold underline cursor-pointer ml-3"
          >
            Annulla eliminazione
          </button>
        </div>
      )}

      {/* Main Two-Column Studio Area */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden">
        {/* ======================================================== */}
        {/* LEFT COLUMN: INDICE DEL LIBRO (42% width) */}
        {/* ======================================================== */}
        <div className="lg:col-span-5 bg-white border-r border-stone-300 flex flex-col h-full overflow-hidden shadow-xs">
          {/* Header of Column */}
          <div className="p-4 bg-stone-50 border-b border-stone-200 space-y-3 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-amber-700" />
                <h2 className="font-serif font-bold text-lg text-stone-900">
                  Indice dei Capitoli
                </h2>
                <span className="text-xs font-bold text-stone-600 bg-stone-200 px-2 py-0.5 rounded-full">
                  {book.chapters.length}
                </span>
              </div>

              {/* Numbering format quick selector */}
              <div className="flex items-center gap-1 text-xs text-stone-600">
                <span className="font-medium">Formato:</span>
                <select
                  value={book.settings.numberingStyle}
                  onChange={(e) =>
                    onUpdateBook({
                      ...book,
                      settings: { ...book.settings, numberingStyle: e.target.value as NumberingStyle },
                      updatedAt: Date.now(),
                    })
                  }
                  className="bg-white border border-stone-300 rounded px-2 py-1 text-xs font-semibold text-stone-800 focus:outline-none focus:border-amber-700"
                >
                  <option value="arabic">1, 2, 3</option>
                  <option value="roman">Capitolo I, II</option>
                  <option value="simple">1., 2.</option>
                  <option value="none">Senza numeri</option>
                </select>
              </div>
            </div>

            {/* Prominent Action Buttons in Column Header */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={onOpenUpload}
                className="py-2 px-3 text-xs font-extrabold uppercase tracking-wider text-stone-950 bg-amber-400 hover:bg-amber-300 active:scale-98 rounded-lg shadow-sm border border-amber-500 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Upload className="w-4 h-4 stroke-[2.5]" />
                <span>Carica File HTML</span>
              </button>

              <button
                onClick={addBlankPage}
                className="py-2 px-3 text-xs font-bold text-stone-800 bg-white hover:bg-stone-100 active:scale-98 rounded-lg border border-stone-300 shadow-2xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4 text-amber-700" />
                <span>Nuova Pagina</span>
              </button>
            </div>
          </div>

          {/* List of Pages in TOC */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 divide-y-0">
            {book.chapters.length === 0 ? (
              <div className="p-8 text-center space-y-4 my-auto">
                <div className="w-14 h-14 mx-auto rounded-full bg-amber-100 text-amber-800 flex items-center justify-center">
                  <FileCode className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-bold text-stone-900">
                    Il libro non ha ancora pagine
                  </h3>
                  <p className="text-xs text-stone-600 mt-1 max-w-xs mx-auto">
                    Carica i file HTML che compongono il tuo libro o aggiungi una pagina vuota.
                  </p>
                </div>
                <button
                  onClick={onOpenUpload}
                  className="px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-stone-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow cursor-pointer inline-flex items-center gap-2 border-2 border-amber-300"
                >
                  <Upload className="w-4 h-4" />
                  <span>Carica i tuoi file HTML</span>
                </button>
              </div>
            ) : (
              book.chapters.map((chapter, index) => {
                const isSelected = chapter.id === (currentChapter?.id || '');
                const isFirst = index === 0;
                const isLast = index === book.chapters.length - 1;

                // Dynamic numbering
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
                    style={{ marginLeft: chapter.level === 2 ? '1.5rem' : '0' }}
                    onClick={() => onSelectChapter(chapter.id)}
                    className={`rounded-xl border-2 transition-all p-3 cursor-pointer flex items-center justify-between gap-3 shadow-2xs ${
                      isSelected
                        ? 'border-amber-600 bg-amber-50/70 ring-2 ring-amber-500/20 shadow-sm'
                        : 'border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50/50'
                    }`}
                  >
                    {/* Left: Number and Title Input */}
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      {/* Number badge */}
                      <span className="font-serif font-black text-sm text-amber-800 shrink-0 min-w-6 text-center">
                        {dynamicNumber || index + 1}
                      </span>

                      {/* Direct Editable Title */}
                      <div className="flex-1 min-w-0">
                        <input
                          type="text"
                          value={chapter.title}
                          onChange={(e) => updateTitle(chapter.id, e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          className="font-serif font-bold text-sm text-stone-900 bg-transparent hover:bg-white focus:bg-white border-b border-transparent hover:border-stone-300 focus:border-amber-600 rounded px-1.5 py-0.5 w-full focus:outline-none transition-colors"
                          placeholder="Titolo della pagina..."
                        />
                        <div className="flex items-center gap-1.5 text-[11px] text-stone-500 mt-0.5 px-1 font-mono">
                          <span className="truncate max-w-44 text-stone-600">
                            {chapter.originalFileName || 'pagina.html'}
                          </span>
                          <span>·</span>
                          <span className="tabular-nums">{chapter.wordCount} parole</span>
                          {chapter.level === 2 && (
                            <>
                              <span>·</span>
                              <span className="text-amber-800 font-bold font-sans">Sotto-pagina</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Direct Visible Controls */}
                    <div
                      className="flex items-center gap-1 shrink-0 bg-stone-100 rounded-lg p-1 border border-stone-200"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Sposta Su */}
                      <button
                        onClick={() => moveChapter(index, 'up')}
                        disabled={isFirst}
                        title="Sposta su"
                        className="p-1.5 text-stone-700 hover:text-stone-950 hover:bg-white rounded disabled:opacity-20 cursor-pointer transition-colors"
                      >
                        <ArrowUp className="w-4 h-4 stroke-[2.5]" />
                      </button>

                      {/* Sposta Giù */}
                      <button
                        onClick={() => moveChapter(index, 'down')}
                        disabled={isLast}
                        title="Sposta giù"
                        className="p-1.5 text-stone-700 hover:text-stone-950 hover:bg-white rounded disabled:opacity-20 cursor-pointer transition-colors"
                      >
                        <ArrowDown className="w-4 h-4 stroke-[2.5]" />
                      </button>

                      {/* Rientro sotto-sezione */}
                      <button
                        onClick={() => toggleSubpage(index)}
                        title={chapter.level === 1 ? 'Rendi sotto-pagina (annida)' : 'Riporta a capitolo principale'}
                        className={`p-1.5 rounded transition-colors cursor-pointer ${
                          chapter.level === 2
                            ? 'text-amber-800 bg-amber-100 font-bold'
                            : 'text-stone-600 hover:text-stone-900 hover:bg-white'
                        }`}
                      >
                        {chapter.level === 1 ? (
                          <ArrowRight className="w-4 h-4" />
                        ) : (
                          <ArrowLeft className="w-4 h-4" />
                        )}
                      </button>

                      {/* ELIMINA DIRETTO (NO window.confirm block!) */}
                      <button
                        onClick={() => deleteChapter(chapter.id)}
                        title="Elimina questa pagina"
                        className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded cursor-pointer transition-colors"
                      >
                        <Trash2 className="w-4 h-4 stroke-[2.5]" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ======================================================== */}
        {/* RIGHT COLUMN: PREVIEW OF SELECTED PAGE (58% width) */}
        {/* ======================================================== */}
        <div className="lg:col-span-7 bg-[#FAF8F5] flex flex-col h-full overflow-hidden">
          {currentChapter ? (
            <>
              {/* Header of Preview Column */}
              <div className="px-4 py-2.5 bg-white border-b border-stone-300 flex items-center justify-between gap-3 flex-shrink-0 shadow-2xs">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
                    Pagina:
                  </span>
                  <span className="font-serif font-bold text-base text-stone-900 truncate">
                    {currentChapter.title}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* Toggle Preview vs Code */}
                  <div className="flex items-center bg-stone-100 p-0.5 rounded-lg border border-stone-300 text-xs font-medium">
                    <button
                      onClick={() => setRightTab('preview')}
                      className={`px-3 py-1 rounded-md transition-colors flex items-center gap-1 cursor-pointer ${
                        rightTab === 'preview'
                          ? 'bg-amber-600 text-white font-bold shadow-2xs'
                          : 'text-stone-700 hover:text-stone-950'
                      }`}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Anteprima Interattiva</span>
                    </button>

                    <button
                      onClick={() => setRightTab('code')}
                      className={`px-3 py-1 rounded-md transition-colors flex items-center gap-1 cursor-pointer ${
                        rightTab === 'code'
                          ? 'bg-amber-600 text-white font-bold shadow-2xs'
                          : 'text-stone-700 hover:text-stone-950'
                      }`}
                    >
                      <Code2 className="w-3.5 h-3.5" />
                      <span>Codice HTML</span>
                    </button>
                  </div>

                  {/* Sfoglia in Full Reader */}
                  <button
                    onClick={() => onNavigateToReader(currentChapter.id)}
                    className="p-1.5 text-stone-700 hover:text-stone-950 bg-stone-100 hover:bg-stone-200 border border-stone-300 rounded-lg cursor-pointer transition-colors"
                    title="Apri nel Lettore a tutto schermo"
                  >
                    <BookOpen className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Body of Preview Column */}
              <div className="flex-1 relative overflow-hidden bg-[#FAF8F5]">
                {rightTab === 'preview' ? (
                  <iframe
                    key={currentChapter.id + (hasHtmlChanges ? '-changed' : '')}
                    srcDoc={previewHtml}
                    sandbox="allow-scripts allow-forms allow-same-origin"
                    title={currentChapter.title}
                    className="w-full h-full border-0 bg-transparent"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col bg-[#1E1E1E] text-stone-100">
                    <div className="px-4 py-2 bg-[#252526] border-b border-stone-700 flex items-center justify-between text-xs">
                      <span className="font-mono text-stone-300 text-[11px]">
                        Codice HTML della pagina
                      </span>
                      {hasHtmlChanges && (
                        <button
                          onClick={saveEditedHtml}
                          className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded text-xs flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Save className="w-3 h-3" />
                          <span>Salva modifiche</span>
                        </button>
                      )}
                    </div>
                    <textarea
                      value={editedHtml}
                      onChange={(e) => {
                        setEditedHtml(e.target.value);
                        setHasHtmlChanges(true);
                      }}
                      className="flex-1 w-full bg-transparent text-amber-100/90 font-mono text-xs p-4 resize-none focus:outline-none leading-relaxed selection:bg-amber-900/60"
                      placeholder="Codice HTML..."
                    />
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-stone-500 space-y-3">
              <FileCode className="w-10 h-10 text-stone-400" />
              <p className="text-sm font-medium">Nessuna pagina selezionata</p>
              <button
                onClick={onOpenUpload}
                className="px-4 py-2 text-xs font-bold text-stone-900 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-sm cursor-pointer"
              >
                Carica File HTML
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
