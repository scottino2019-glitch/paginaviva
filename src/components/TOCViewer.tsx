import React, { useState } from 'react';
import { Book, Chapter, NumberingStyle } from '../types/book';
import { formatChapterNumber } from '../utils/romanNumerals';
import {
  ArrowUp,
  ArrowDown,
  ArrowRight,
  ArrowLeft,
  Trash2,
  Copy,
  BookOpen,
  Code2,
  Sparkles,
  Settings,
  Plus,
  Search,
  ListOrdered,
  Layers,
  Clock,
  FileText
} from 'lucide-react';

interface TOCViewerProps {
  book: Book;
  onUpdateBook: (updated: Book) => void;
  onSelectChapterToRead: (chapterId: string) => void;
  onSelectChapterToEdit: (chapterId: string) => void;
  onOpenUpload: () => void;
  onOpenSettings: () => void;
}

export const TOCViewer: React.FC<TOCViewerProps> = ({
  book,
  onUpdateBook,
  onSelectChapterToRead,
  onSelectChapterToEdit,
  onOpenUpload,
  onOpenSettings,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [editingSubtitle, setEditingSubtitle] = useState('');

  // Reordering helpers
  const moveChapter = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= book.chapters.length) return;

    const newChapters = [...book.chapters];
    const temp = newChapters[index];
    newChapters[index] = newChapters[targetIndex];
    newChapters[targetIndex] = temp;

    // Recalculate order indices
    const updatedChapters = newChapters.map((ch, idx) => ({ ...ch, order: idx }));
    onUpdateBook({ ...book, chapters: updatedChapters, updatedAt: Date.now() });
  };

  const changeLevel = (index: number, delta: number) => {
    const ch = book.chapters[index];
    const newLevel = Math.max(1, Math.min(3, ch.level + delta)) as 1 | 2 | 3;
    if (newLevel === ch.level) return;

    const newChapters = [...book.chapters];
    newChapters[index] = { ...ch, level: newLevel };
    onUpdateBook({ ...book, chapters: newChapters, updatedAt: Date.now() });
  };

  const deleteChapter = (chapterId: string) => {
    if (book.chapters.length <= 1) {
      alert('Il libro deve contenere almeno un capitolo.');
      return;
    }
    const confirmed = confirm('Sei sicuro di voler rimuovere questo capitolo dal libro?');
    if (!confirmed) return;

    const newChapters = book.chapters
      .filter((c) => c.id !== chapterId)
      .map((c, idx) => ({ ...c, order: idx }));
    onUpdateBook({ ...book, chapters: newChapters, updatedAt: Date.now() });
  };

  const duplicateChapter = (index: number) => {
    const original = book.chapters[index];
    const copy: Chapter = {
      ...original,
      id: `chapter-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: `${original.title} (Copia)`,
      order: index + 1,
    };

    const newChapters = [...book.chapters];
    newChapters.splice(index + 1, 0, copy);
    const reindexed = newChapters.map((c, idx) => ({ ...c, order: idx }));
    onUpdateBook({ ...book, chapters: reindexed, updatedAt: Date.now() });
  };

  const startQuickEdit = (ch: Chapter) => {
    setEditingChapterId(ch.id);
    setEditingTitle(ch.title);
    setEditingSubtitle(ch.subtitle || '');
  };

  const saveQuickEdit = () => {
    if (!editingChapterId) return;
    const newChapters = book.chapters.map((c) =>
      c.id === editingChapterId
        ? { ...c, title: editingTitle.trim() || c.title, subtitle: editingSubtitle.trim() }
        : c
    );
    onUpdateBook({ ...book, chapters: newChapters, updatedAt: Date.now() });
    setEditingChapterId(null);
  };

  // Stats calculation
  const totalWords = book.chapters.reduce((sum, ch) => sum + ch.wordCount, 0);
  const totalMinutes = book.chapters.reduce((sum, ch) => sum + ch.estimatedReadMinutes, 0);
  const interactiveChaptersCount = book.chapters.filter((ch) => ch.hasInteractiveElements).length;

  // Filtered chapters for display
  const filteredChapters = book.chapters.filter((ch) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      ch.title.toLowerCase().includes(q) ||
      (ch.subtitle && ch.subtitle.toLowerCase().includes(q)) ||
      ch.type.toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Editorial Book Hero / Overview */}
      <section className="bg-white border border-stone-200 rounded-xl p-6 lg:p-8 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-stone-200">
          <div className="space-y-2 max-w-2xl">
            <div className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              {book.language.toUpperCase()} · MANOSCRITTO DIGITALE
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-stone-900 text-balance">
              {book.title}
            </h1>
            {book.subtitle && (
              <p className="font-serif italic text-base sm:text-lg text-stone-600">
                {book.subtitle}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500 pt-1">
              <span>Autore: <strong className="font-medium text-stone-700">{book.author}</strong></span>
              <span>·</span>
              <span>Ultimo aggiornamento: {new Date(book.updatedAt).toLocaleDateString('it-IT')}</span>
            </div>
          </div>

          {/* Quick Book Actions */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => onSelectChapterToRead(book.chapters[0]?.id || '')}
              className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-white bg-amber-900 hover:bg-amber-800 rounded-lg shadow-sm transition-all flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <BookOpen className="w-4 h-4" />
              <span>Leggi Libro</span>
            </button>
            <button
              onClick={onOpenSettings}
              className="px-3.5 py-2.5 text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Personalizza stile indice, numerazione e dettagli"
            >
              <Settings className="w-4 h-4" />
              <span>Impostazioni Indice</span>
            </button>
          </div>
        </div>

        {/* Operational Metrics Strip (Anti-slop, clean unboxed metadata) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 text-stone-700 font-ui">
          <div className="space-y-1">
            <div className="text-xs text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-stone-400" />
              <span>Capitoli Totali</span>
            </div>
            <div className="text-2xl font-bold tabular-nums text-stone-900">
              {book.chapters.length}
            </div>
            <div className="text-[11px] text-stone-500">
              organizzati nell'indice dinamico
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-xs text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-stone-400" />
              <span>Conteggio Parole</span>
            </div>
            <div className="text-2xl font-bold tabular-nums text-stone-900">
              {totalWords.toLocaleString()}
            </div>
            <div className="text-[11px] text-stone-500">
              estratte automaticamente dai file
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-xs text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-stone-400" />
              <span>Tempo di Lettura</span>
            </div>
            <div className="text-2xl font-bold tabular-nums text-stone-900">
              ~{totalMinutes} min
            </div>
            <div className="text-[11px] text-stone-500">
              a ritmo medio (180 p/m)
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-xs text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Capitoli Interattivi</span>
            </div>
            <div className="text-2xl font-bold tabular-nums text-stone-900">
              {interactiveChaptersCount} <span className="text-xs font-normal text-stone-500">/ {book.chapters.length}</span>
            </div>
            <div className="text-[11px] text-stone-500">
              con scelte, bottoni o script
            </div>
          </div>
        </div>
      </section>

      {/* Dynamic Table of Contents Control Section */}
      <section className="space-y-4">
        {/* Controls Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <ListOrdered className="w-5 h-5 text-amber-800" />
            <div>
              <h2 className="font-display text-xl font-bold text-stone-900">
                Indice Dinamico dei Capitoli
              </h2>
              <p className="text-xs text-stone-500">
                La numerazione e la struttura ad albero si aggiornano in tempo reale al variare dell'ordine.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Search Filter */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cerca capitolo..."
                className="pl-8 pr-3 py-1.5 text-xs bg-white border border-stone-200 rounded-lg text-stone-800 placeholder-stone-400 focus:outline-none focus:border-amber-800 w-44 sm:w-56"
              />
            </div>

            <button
              onClick={onOpenUpload}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Aggiungi HTML</span>
            </button>
          </div>
        </div>

        {/* Dynamic Chapter Cards Tree */}
        <div className="space-y-2.5">
          {filteredChapters.map((chapter) => {
            const index = book.chapters.findIndex((c) => c.id === chapter.id);
            const isFirst = index === 0;
            const isLast = index === book.chapters.length - 1;

            // Compute dynamic Roman/Arabic label
            const chapterSequenceIndex =
              book.chapters.slice(0, index + 1).filter((c) => c.type === chapter.type).length;
            const dynamicNumberLabel = formatChapterNumber(
              chapter,
              chapterSequenceIndex,
              book.settings.numberingStyle,
              book.settings.customPrefix
            );

            const isEditing = editingChapterId === chapter.id;

            return (
              <div
                key={chapter.id}
                style={{ marginLeft: `${(chapter.level - 1) * 2}rem` }}
                className={`bg-white border transition-all rounded-lg p-4 shadow-2xs hover:shadow-xs group ${
                  chapter.level > 1
                    ? 'border-stone-200/80 bg-stone-50/40 relative before:absolute before:-left-4 before:top-1/2 before:w-3 before:h-px before:bg-stone-300'
                    : 'border-stone-200'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Left: Reordering & Level Controls */}
                  <div className="flex items-center gap-2">
                    {/* Vertical movement */}
                    <div className="flex flex-col gap-0.5">
                      <button
                        onClick={() => moveChapter(index, 'up')}
                        disabled={isFirst}
                        title="Sposta prima nell'indice"
                        className="p-1 text-stone-400 hover:text-stone-900 disabled:opacity-20 disabled:hover:text-stone-400 rounded hover:bg-stone-100 transition-colors cursor-pointer"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => moveChapter(index, 'down')}
                        disabled={isLast}
                        title="Sposta dopo nell'indice"
                        className="p-1 text-stone-400 hover:text-stone-900 disabled:opacity-20 disabled:hover:text-stone-400 rounded hover:bg-stone-100 transition-colors cursor-pointer"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Indentation / Hierarchy depth */}
                    <div className="flex items-center gap-0.5 border-l border-stone-200 pl-1.5">
                      <button
                        onClick={() => changeLevel(index, -1)}
                        disabled={chapter.level <= 1}
                        title="Promuovi a livello superiore (de-annida)"
                        className="p-1 text-stone-400 hover:text-stone-900 disabled:opacity-20 disabled:hover:text-stone-400 rounded hover:bg-stone-100 transition-colors cursor-pointer"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => changeLevel(index, 1)}
                        disabled={chapter.level >= 3}
                        title="Annida come sotto-sezione (aumenta profondità)"
                        className="p-1 text-stone-400 hover:text-stone-900 disabled:opacity-20 disabled:hover:text-stone-400 rounded hover:bg-stone-100 transition-colors cursor-pointer"
                      >
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Middle: Title, Dynamic Number & Metadata */}
                  <div className="flex-1 min-w-0">
                    {isEditing ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          placeholder="Titolo capitolo"
                          className="w-full text-sm font-semibold text-stone-900 bg-stone-50 border border-stone-300 rounded px-2.5 py-1 focus:outline-none focus:border-amber-800"
                        />
                        <input
                          type="text"
                          value={editingSubtitle}
                          onChange={(e) => setEditingSubtitle(e.target.value)}
                          placeholder="Sottotitolo descrittivo (opzionale)"
                          className="w-full text-xs text-stone-600 bg-stone-50 border border-stone-300 rounded px-2.5 py-1 focus:outline-none focus:border-amber-800"
                        />
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            onClick={saveQuickEdit}
                            className="px-2.5 py-1 text-xs font-semibold bg-stone-900 text-white rounded hover:bg-stone-800 cursor-pointer"
                          >
                            Salva
                          </button>
                          <button
                            onClick={() => setEditingChapterId(null)}
                            className="px-2.5 py-1 text-xs text-stone-600 hover:text-stone-900 cursor-pointer"
                          >
                            Annulla
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="flex flex-wrap items-baseline gap-2">
                          {dynamicNumberLabel && (
                            <span className="font-ui text-xs font-semibold uppercase tracking-wider text-amber-900/80">
                              {dynamicNumberLabel}
                            </span>
                          )}
                          <h3
                            onClick={() => onSelectChapterToRead(chapter.id)}
                            className="font-serif text-lg font-bold text-stone-900 hover:text-amber-900 cursor-pointer transition-colors"
                          >
                            {chapter.title}
                          </h3>
                        </div>

                        {chapter.subtitle && (
                          <p className="text-xs font-serif italic text-stone-500 mt-0.5">
                            {chapter.subtitle}
                          </p>
                        )}

                        {/* Unboxed Metadata (Zero-pill discipline) */}
                        <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500 mt-1.5 font-ui">
                          <span className="capitalize">{chapter.type}</span>
                          <span>·</span>
                          <span>{chapter.wordCount.toLocaleString()} parole</span>
                          <span>·</span>
                          <span>~{chapter.estimatedReadMinutes} min di lettura</span>
                          {chapter.level > 1 && (
                            <>
                              <span>·</span>
                              <span className="text-stone-600 font-medium">Livello {chapter.level}</span>
                            </>
                          )}
                          {chapter.hasInteractiveElements && (
                            <>
                              <span>·</span>
                              <span className="text-amber-800 font-medium inline-flex items-center gap-1">
                                <Sparkles className="w-3 h-3" />
                                {chapter.interactiveDetails[0] || 'Interattivo'}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                    <button
                      onClick={() => onSelectChapterToRead(chapter.id)}
                      className="px-2.5 py-1.5 text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-md transition-colors flex items-center gap-1 cursor-pointer"
                      title="Leggi questo capitolo"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Leggi</span>
                    </button>

                    <button
                      onClick={() => onSelectChapterToEdit(chapter.id)}
                      className="px-2.5 py-1.5 text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-md transition-colors flex items-center gap-1 cursor-pointer"
                      title="Ispeziona o modifica codice HTML"
                    >
                      <Code2 className="w-3.5 h-3.5" />
                      <span>Codice</span>
                    </button>

                    <button
                      onClick={() => startQuickEdit(chapter)}
                      className="p-1.5 text-stone-500 hover:text-stone-900 rounded hover:bg-stone-100 transition-colors cursor-pointer"
                      title="Rinomina titolo e sottotitolo"
                    >
                      <FileText className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => duplicateChapter(index)}
                      className="p-1.5 text-stone-500 hover:text-stone-900 rounded hover:bg-stone-100 transition-colors cursor-pointer"
                      title="Duplica capitolo"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => deleteChapter(chapter.id)}
                      className="p-1.5 text-stone-400 hover:text-red-700 rounded hover:bg-red-50 transition-colors cursor-pointer"
                      title="Elimina capitolo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredChapters.length === 0 && (
            <div className="p-8 text-center bg-white border border-dashed border-stone-300 rounded-xl">
              <p className="text-sm text-stone-500">
                Nessun capitolo trovato per "{searchQuery}".
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
