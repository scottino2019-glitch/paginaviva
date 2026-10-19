import React, { useState } from 'react';
import { Book, Chapter, NumberingStyle } from '../types/book';
import { formatChapterNumber } from '../utils/romanNumerals';
import {
  ArrowUp,
  ArrowDown,
  Trash2,
  Upload,
  Plus,
  BookOpen,
  FileCode,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Layers
} from 'lucide-react';

interface MobileChapterListProps {
  book: Book;
  selectedChapterId: string;
  onSelectChapter: (id: string) => void;
  onOpenReader: (id: string) => void;
  onUpdateBook: (updated: Book) => void;
  onOpenUpload: () => void;
}

export const MobileChapterList: React.FC<MobileChapterListProps> = ({
  book,
  selectedChapterId,
  onSelectChapter,
  onOpenReader,
  onUpdateBook,
  onOpenUpload,
}) => {
  const [deletedUndo, setDeletedUndo] = useState<{ chapter: Chapter; index: number } | null>(null);

  // Reorder up / down
  const move = (index: number, direction: 'up' | 'down') => {
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= book.chapters.length) return;

    const list = [...book.chapters];
    const item = list[index];
    list[index] = list[target];
    list[target] = item;

    const reordered = list.map((c, i) => ({ ...c, order: i }));
    onUpdateBook({ ...book, chapters: reordered, updatedAt: Date.now() });
  };

  // Toggle subpage level
  const toggleSubpage = (index: number) => {
    const ch = book.chapters[index];
    const newLevel = ch.level === 1 ? 2 : 1;
    const list = [...book.chapters];
    list[index] = { ...ch, level: newLevel };
    onUpdateBook({ ...book, chapters: list, updatedAt: Date.now() });
  };

  // INSTANT DELETE WITHOUT window.confirm
  const remove = (chapterId: string) => {
    const index = book.chapters.findIndex((c) => c.id === chapterId);
    if (index === -1) return;

    const item = book.chapters[index];
    const list = book.chapters.filter((c) => c.id !== chapterId).map((c, i) => ({ ...c, order: i }));

    setDeletedUndo({ chapter: item, index });
    onUpdateBook({ ...book, chapters: list, updatedAt: Date.now() });

    if (selectedChapterId === chapterId) {
      onSelectChapter(list[0]?.id || '');
    }
  };

  // Undo delete
  const undo = () => {
    if (!deletedUndo) return;
    const list = [...book.chapters];
    list.splice(deletedUndo.index, 0, deletedUndo.chapter);
    const reordered = list.map((c, i) => ({ ...c, order: i }));
    onUpdateBook({ ...book, chapters: reordered, updatedAt: Date.now() });
    onSelectChapter(deletedUndo.chapter.id);
    setDeletedUndo(null);
  };

  // Add a blank page
  const addBlank = () => {
    const newPage: Chapter = {
      id: `page-${Date.now()}`,
      title: `Pagina ${book.chapters.length + 1}`,
      rawHtml: `<h1>Nuova Pagina</h1>\n<p>Scrivi qui il testo...</p>`,
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
    onUpdateBook({ ...book, chapters: list, updatedAt: Date.now() });
    onSelectChapter(newPage.id);
  };

  // Direct title edit
  const updateTitle = (id: string, text: string) => {
    const list = book.chapters.map((c) => (c.id === id ? { ...c, title: text } : c));
    onUpdateBook({ ...book, chapters: list, updatedAt: Date.now() });
  };

  return (
    <div className="max-w-2xl mx-auto px-3 py-4 space-y-4 pb-24">
      {/* Undo banner if deleted */}
      {deletedUndo && (
        <div className="bg-stone-900 text-white p-3 rounded-xl flex items-center justify-between text-xs shadow-lg">
          <span className="truncate mr-2">
            Pagina <strong>"{deletedUndo.chapter.title}"</strong> eliminata.
          </span>
          <button
            onClick={undo}
            className="text-amber-400 font-extrabold underline shrink-0 px-2 py-1 min-h-[36px]"
          >
            Annulla
          </button>
        </div>
      )}

      {/* Top Action Card */}
      <div className="bg-white border-2 border-stone-200 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Layers className="w-5 h-5 text-amber-700" />
            <h2 className="font-serif font-bold text-base text-stone-900">
              Pagine del tuo Libro
            </h2>
            <span className="text-xs font-bold bg-stone-200 text-stone-800 px-2 py-0.5 rounded-full">
              {book.chapters.length}
            </span>
          </div>

          {/* Numbering selector */}
          <select
            value={book.settings.numberingStyle}
            onChange={(e) =>
              onUpdateBook({
                ...book,
                settings: { ...book.settings, numberingStyle: e.target.value as NumberingStyle },
                updatedAt: Date.now(),
              })
            }
            className="bg-stone-100 border border-stone-300 rounded-lg px-2 py-1 text-xs font-bold text-stone-800"
          >
            <option value="arabic">Numeri: 1, 2, 3</option>
            <option value="roman">Capitolo I, II</option>
            <option value="simple">Solo cifra: 1., 2.</option>
            <option value="none">Senza numeri</option>
          </select>
        </div>

        {/* Big Touch CTA: Carica File HTML */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={onOpenUpload}
            className="w-full py-3 px-3 text-xs font-black uppercase tracking-wider text-stone-950 bg-amber-400 hover:bg-amber-300 active:scale-95 rounded-xl shadow border-2 border-amber-500 flex items-center justify-center gap-2 cursor-pointer min-h-[48px]"
          >
            <Upload className="w-4 h-4 stroke-[3]" />
            <span>Carica HTML</span>
          </button>

          <button
            onClick={addBlank}
            className="w-full py-3 px-3 text-xs font-bold text-stone-800 bg-stone-100 hover:bg-stone-200 active:scale-95 rounded-xl border border-stone-300 flex items-center justify-center gap-1.5 cursor-pointer min-h-[48px]"
          >
            <Plus className="w-4 h-4 text-amber-700" />
            <span>Nuova Pagina</span>
          </button>
        </div>
      </div>

      {/* Chapter Cards List */}
      {book.chapters.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-stone-300 rounded-2xl p-8 text-center space-y-4">
          <FileCode className="w-12 h-12 mx-auto text-amber-600" />
          <div>
            <h3 className="font-serif font-bold text-lg text-stone-900">
              Nessuna pagina nel libro
            </h3>
            <p className="text-xs text-stone-600 mt-1">
              Carica i file HTML delle tue pagine per vederli apparire qui ordinati.
            </p>
          </div>
          <button
            onClick={onOpenUpload}
            className="w-full py-3 text-xs font-black uppercase text-stone-950 bg-amber-400 hover:bg-amber-300 rounded-xl shadow border-2 border-amber-500 flex items-center justify-center gap-2 min-h-[48px]"
          >
            <Upload className="w-4 h-4" />
            <span>Carica i tuoi file HTML</span>
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
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
                style={{ marginLeft: chapter.level === 2 ? '1rem' : '0' }}
                className={`bg-white border-2 rounded-2xl p-3 shadow-xs transition-all space-y-2.5 ${
                  chapter.id === selectedChapterId ? 'border-amber-600 ring-2 ring-amber-400/30' : 'border-stone-200'
                }`}
              >
                {/* Row 1: Number, Title, and Tap to Read */}
                <div className="flex items-center gap-2">
                  {/* Number Badge */}
                  <span className="font-serif font-black text-sm text-amber-900 bg-amber-100 border border-amber-300 rounded-lg px-2 py-1 shrink-0 min-w-7 text-center">
                    {dynamicNumber || index + 1}
                  </span>

                  {/* Title Input */}
                  <input
                    type="text"
                    value={chapter.title}
                    onChange={(e) => updateTitle(chapter.id, e.target.value)}
                    className="font-serif font-bold text-sm text-stone-900 bg-stone-50 border border-stone-200 focus:border-amber-600 rounded-lg px-2.5 py-1.5 flex-1 min-w-0 focus:outline-none"
                    placeholder="Titolo pagina..."
                  />

                  {/* Tap to Read Page */}
                  <button
                    onClick={() => {
                      onSelectChapter(chapter.id);
                      onOpenReader(chapter.id);
                    }}
                    className="px-2.5 py-1.5 text-xs font-bold text-amber-950 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-lg flex items-center gap-1 shrink-0 min-h-[38px] cursor-pointer"
                    title="Leggi subito questa pagina"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Leggi</span>
                  </button>
                </div>

                {/* Row 2: Filename & Direct Controls */}
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-stone-100 text-xs">
                  <div className="flex items-center gap-1 text-[11px] text-stone-500 font-mono truncate max-w-[150px]">
                    <span className="truncate">{chapter.originalFileName || 'file.html'}</span>
                    {chapter.level === 2 && (
                      <span className="text-amber-800 font-bold font-sans">↳ Sotto-pagina</span>
                    )}
                  </div>

                  {/* Action Touch Buttons (Min 40px each for thumbs) */}
                  <div className="flex items-center gap-1 shrink-0">
                    {/* Sposta Su */}
                    <button
                      onClick={() => move(index, 'up')}
                      disabled={isFirst}
                      title="Sposta prima"
                      className="p-2 text-stone-700 bg-stone-100 hover:bg-stone-200 active:bg-stone-300 disabled:opacity-20 rounded-lg min-h-[40px] min-w-[40px] flex items-center justify-center cursor-pointer"
                    >
                      <ArrowUp className="w-4 h-4 stroke-[2.5]" />
                    </button>

                    {/* Sposta Giù */}
                    <button
                      onClick={() => move(index, 'down')}
                      disabled={isLast}
                      title="Sposta dopo"
                      className="p-2 text-stone-700 bg-stone-100 hover:bg-stone-200 active:bg-stone-300 disabled:opacity-20 rounded-lg min-h-[40px] min-w-[40px] flex items-center justify-center cursor-pointer"
                    >
                      <ArrowDown className="w-4 h-4 stroke-[2.5]" />
                    </button>

                    {/* Rientro sotto-sezione */}
                    <button
                      onClick={() => toggleSubpage(index)}
                      title={chapter.level === 1 ? 'Annida' : 'Promuovi'}
                      className={`p-2 rounded-lg min-h-[40px] min-w-[40px] flex items-center justify-center cursor-pointer ${
                        chapter.level === 2
                          ? 'bg-amber-100 text-amber-900 font-bold border border-amber-300'
                          : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                      }`}
                    >
                      {chapter.level === 1 ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
                    </button>

                    {/* ELIMINA ISTANTANEO (ZERO confirm block!) */}
                    <button
                      onClick={() => remove(chapter.id)}
                      title="Elimina pagina"
                      className="p-2 text-red-600 bg-red-50 hover:bg-red-100 active:bg-red-200 border border-red-200 rounded-lg min-h-[40px] min-w-[40px] flex items-center justify-center cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4 stroke-[2.5]" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
