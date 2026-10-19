import React, { useState, useEffect, useMemo } from 'react';
import { Book, Chapter, ChapterType } from '../types/book';
import { parseHtmlContent, buildReaderDocument } from '../utils/htmlParser';
import {
  Code2,
  Eye,
  Sparkles,
  Save,
  RotateCcw,
  PlusCircle,
  FileCode,
  Layers,
  HelpCircle,
  Play
} from 'lucide-react';

interface ChapterEditorProps {
  book: Book;
  currentChapterId: string;
  onUpdateChapter: (updatedChapter: Chapter) => void;
  onSelectChapter: (chapterId: string) => void;
}

export const ChapterEditor: React.FC<ChapterEditorProps> = ({
  book,
  currentChapterId,
  onUpdateChapter,
  onSelectChapter,
}) => {
  const chapter = book.chapters.find((c) => c.id === currentChapterId) || book.chapters[0];

  const [title, setTitle] = useState(chapter.title);
  const [subtitle, setSubtitle] = useState(chapter.subtitle || '');
  const [type, setType] = useState<ChapterType>(chapter.type);
  const [level, setLevel] = useState<1 | 2 | 3>(chapter.level);
  const [rawHtml, setRawHtml] = useState(chapter.rawHtml);
  const [notes, setNotes] = useState(chapter.notes || '');
  const [activePane, setActivePane] = useState<'both' | 'code' | 'preview'>('both');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Sync state when currentChapterId changes
  useEffect(() => {
    if (chapter) {
      setTitle(chapter.title);
      setSubtitle(chapter.subtitle || '');
      setType(chapter.type);
      setLevel(chapter.level);
      setRawHtml(chapter.rawHtml);
      setNotes(chapter.notes || '');
      setHasUnsavedChanges(false);
    }
  }, [chapter?.id]);

  // Live parsed analysis
  const analysis = useMemo(() => {
    return parseHtmlContent(rawHtml);
  }, [rawHtml]);

  // Reader preview HTML
  const previewDoc = useMemo(() => {
    return buildReaderDocument(rawHtml, chapter.id, 'paper', 'base');
  }, [rawHtml, chapter.id]);

  const handleSave = () => {
    const updated: Chapter = {
      ...chapter,
      title: title.trim() || analysis.title || 'Capitolo',
      subtitle: subtitle.trim(),
      type,
      level,
      rawHtml,
      notes: notes.trim(),
      wordCount: analysis.wordCount,
      estimatedReadMinutes: analysis.estimatedReadMinutes,
      hasInteractiveElements: analysis.hasInteractiveElements,
      interactiveDetails: analysis.interactiveDetails,
      detectedHeadings: analysis.detectedHeadings,
    };
    onUpdateChapter(updated);
    setHasUnsavedChanges(false);
  };

  const insertSnippet = (snippet: string) => {
    setRawHtml((prev) => prev + '\n' + snippet);
    setHasUnsavedChanges(true);
  };

  const handleReset = () => {
    setTitle(chapter.title);
    setSubtitle(chapter.subtitle || '');
    setRawHtml(chapter.rawHtml);
    setHasUnsavedChanges(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
      {/* Top Bar: Chapter Switcher & Status */}
      <div className="bg-white border border-stone-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <FileCode className="w-5 h-5 text-amber-800" />
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              Modifica Capitolo:
            </span>
            <select
              value={chapter.id}
              onChange={(e) => onSelectChapter(e.target.value)}
              className="font-serif font-bold text-base text-stone-900 bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1 focus:outline-none focus:border-amber-800"
            >
              {book.chapters.map((ch, idx) => (
                <option key={ch.id} value={ch.id}>
                  {idx + 1}. {ch.title} ({ch.type})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          {/* Layout switches */}
          <div className="hidden sm:flex items-center gap-1 bg-stone-100 p-0.5 rounded-lg text-xs font-ui">
            <button
              onClick={() => setActivePane('both')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                activePane === 'both' ? 'bg-white text-stone-900 shadow-2xs font-semibold' : 'text-stone-600'
              }`}
            >
              Diviso
            </button>
            <button
              onClick={() => setActivePane('code')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                activePane === 'code' ? 'bg-white text-stone-900 shadow-2xs font-semibold' : 'text-stone-600'
              }`}
            >
              Solo Codice
            </button>
            <button
              onClick={() => setActivePane('preview')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                activePane === 'preview' ? 'bg-white text-stone-900 shadow-2xs font-semibold' : 'text-stone-600'
              }`}
            >
              Anteprima
            </button>
          </div>

          {hasUnsavedChanges && (
            <button
              onClick={handleReset}
              className="px-3 py-1.5 text-xs text-stone-600 hover:text-stone-900 rounded-lg border border-stone-200 flex items-center gap-1 cursor-pointer"
              title="Ripristina modifiche non salvate"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Annulla</span>
            </button>
          )}

          <button
            onClick={handleSave}
            className={`px-4 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              hasUnsavedChanges
                ? 'bg-amber-900 text-white hover:bg-amber-800 shadow-sm'
                : 'bg-stone-200 text-stone-600'
            }`}
          >
            <Save className="w-3.5 h-3.5" />
            <span>Salva Modifiche</span>
          </button>
        </div>
      </div>

      {/* Chapter Metadata Form */}
      <div className="bg-white border border-stone-200 rounded-xl p-4 grid grid-cols-1 md:grid-cols-4 gap-3 text-xs font-ui shadow-xs">
        <div className="md:col-span-2">
          <label className="block text-stone-600 font-semibold uppercase tracking-wider mb-1">
            Titolo Capitolo
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setHasUnsavedChanges(true);
            }}
            className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-1.5 text-xs font-serif font-bold text-stone-900 focus:outline-none focus:border-amber-800"
          />
        </div>

        <div>
          <label className="block text-stone-600 font-semibold uppercase tracking-wider mb-1">
            Tipo Struttura
          </label>
          <select
            value={type}
            onChange={(e) => {
              setType(e.target.value as ChapterType);
              setHasUnsavedChanges(true);
            }}
            className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-1.5 text-xs text-stone-800 focus:outline-none focus:border-amber-800"
          >
            <option value="chapter">Capitolo Ordinario</option>
            <option value="prologue">Prologo</option>
            <option value="interlude">Interludio</option>
            <option value="epilogue">Epilogo</option>
            <option value="appendix">Appendice</option>
          </select>
        </div>

        <div>
          <label className="block text-stone-600 font-semibold uppercase tracking-wider mb-1">
            Livello Indice
          </label>
          <select
            value={level}
            onChange={(e) => {
              setLevel(Number(e.target.value) as 1 | 2 | 3);
              setHasUnsavedChanges(true);
            }}
            className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-1.5 text-xs text-stone-800 focus:outline-none focus:border-amber-800"
          >
            <option value={1}>Livello 1 (Capitolo Principale)</option>
            <option value={2}>Livello 2 (Sotto-sezione indiciata)</option>
            <option value={3}>Livello 3 (Passaggio di terzo livello)</option>
          </select>
        </div>
      </div>

      {/* Interactive Snippets Insertion Toolbar */}
      <div className="flex flex-wrap items-center gap-2 text-xs font-ui">
        <span className="text-stone-500 font-semibold uppercase tracking-wider text-[11px] mr-1">
          Scorciatoie Interattive:
        </span>
        <button
          onClick={() =>
            insertSnippet(`
<div class="choice-group">
  <h3>Scegli come proseguire:</h3>
  <div class="choice-item" onclick="alert('Hai scelto la via misteriosa!')">
    <span>Prendi il sentiero illuminato dalle lucciole</span>
    <span>&rarr;</span>
  </div>
</div>`)
          }
          className="px-2.5 py-1 bg-white hover:bg-stone-100 border border-stone-200 rounded text-stone-700 transition-colors flex items-center gap-1 cursor-pointer"
        >
          <PlusCircle className="w-3 h-3 text-amber-700" />
          <span>Gruppo Scelte Bivio</span>
        </button>

        <button
          onClick={() =>
            insertSnippet(`
<button data-jump-chapter="chapter-2" class="choice-btn">
  Salta direttamente al Capitolo II &rarr;
</button>`)
          }
          className="px-2.5 py-1 bg-white hover:bg-stone-100 border border-stone-200 rounded text-stone-700 transition-colors flex items-center gap-1 cursor-pointer"
        >
          <PlusCircle className="w-3 h-3 text-amber-700" />
          <span>Salto a Capitolo</span>
        </button>

        <button
          onClick={() =>
            insertSnippet(`
<details>
  <summary>🔍 Esamina l'oggetto misterioso</summary>
  <p style="margin-top: 0.5rem; font-style: italic;">
    Hai scoperto una chiave d'argento con tre tacche incise sul manico.
  </p>
</details>`)
          }
          className="px-2.5 py-1 bg-white hover:bg-stone-100 border border-stone-200 rounded text-stone-700 transition-colors flex items-center gap-1 cursor-pointer"
        >
          <PlusCircle className="w-3 h-3 text-amber-700" />
          <span>Segreto a Scomparsa (Details)</span>
        </button>

        <button
          onClick={() =>
            insertSnippet(`
<script>
  console.log("Capitolo pronto all'interazione!");
</script>`)
          }
          className="px-2.5 py-1 bg-white hover:bg-stone-100 border border-stone-200 rounded text-stone-700 transition-colors flex items-center gap-1 cursor-pointer"
        >
          <PlusCircle className="w-3 h-3 text-amber-700" />
          <span>Blocco &lt;script&gt;</span>
        </button>
      </div>

      {/* Editor & Preview Panes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[600px]">
        {/* Left: Code Pane */}
        {(activePane === 'both' || activePane === 'code') && (
          <div className="bg-[#1E1E1E] text-stone-100 rounded-xl flex flex-col overflow-hidden border border-stone-700 shadow-md">
            <div className="px-4 py-2 bg-[#252526] border-b border-stone-700 flex items-center justify-between text-xs text-stone-300">
              <span className="font-mono flex items-center gap-1.5">
                <Code2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Sorgente HTML / Stili / Script</span>
              </span>
              <span className="text-[11px] text-stone-400 font-mono">
                {rawHtml.length} caratteri
              </span>
            </div>

            <textarea
              value={rawHtml}
              onChange={(e) => {
                setRawHtml(e.target.value);
                setHasUnsavedChanges(true);
              }}
              spellCheck={false}
              className="flex-1 w-full bg-transparent text-amber-100/90 font-mono text-xs p-4 resize-none focus:outline-none leading-relaxed selection:bg-amber-900/60"
            />
          </div>
        )}

        {/* Right: Live Preview Pane */}
        {(activePane === 'both' || activePane === 'preview') && (
          <div className="bg-[#FAF8F5] rounded-xl flex flex-col overflow-hidden border border-stone-300 shadow-md">
            <div className="px-4 py-2 bg-stone-100 border-b border-stone-200 flex items-center justify-between text-xs text-stone-700">
              <span className="font-medium flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-amber-800" />
                <span>Anteprima Dinamica dal Vivo</span>
              </span>
              <div className="flex items-center gap-2 text-[11px] text-stone-500">
                <span>{analysis.wordCount} parole</span>
                <span>·</span>
                <span>~{analysis.estimatedReadMinutes} min</span>
                {analysis.hasInteractiveElements && (
                  <span className="text-amber-800 font-semibold flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Interattivo
                  </span>
                )}
              </div>
            </div>

            <div className="flex-1 relative bg-white overflow-hidden">
              <iframe
                srcDoc={previewDoc}
                sandbox="allow-scripts allow-forms allow-same-origin"
                title="Anteprima Capitolo"
                className="w-full h-full border-0"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
