import React, { useState, useRef } from 'react';
import { Chapter, ChapterType } from '../types/book';
import { parseHtmlContent } from '../utils/htmlParser';
import { Upload, FileCode, Check, X, Sparkles, AlertCircle, Plus } from 'lucide-react';

interface HtmlUploaderProps {
  isOpen: boolean;
  onClose: () => void;
  onAddChapters: (chapters: Chapter[], insertPosition: 'end' | 'start' | 'after_selected') => void;
  existingChapterCount: number;
}

interface PendingFile {
  id: string;
  fileName: string;
  title: string;
  subtitle?: string;
  rawHtml: string;
  type: ChapterType;
  level: 1 | 2 | 3;
  wordCount: number;
  estimatedReadMinutes: number;
  hasInteractiveElements: boolean;
  interactiveDetails: string[];
}

export const HtmlUploader: React.FC<HtmlUploaderProps> = ({
  isOpen,
  onClose,
  onAddChapters,
  existingChapterCount,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [insertPosition, setInsertPosition] = useState<'end' | 'start' | 'after_selected'>('end');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Paste raw HTML state
  const [pasteTitle, setPasteTitle] = useState('');
  const [pasteHtml, setPasteHtml] = useState('');
  const [pasteType, setPasteType] = useState<ChapterType>('chapter');
  const [pasteLevel, setPasteLevel] = useState<1 | 2 | 3>(1);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const processFile = async (file: File): Promise<PendingFile> => {
    const text = await file.text();
    const parsed = parseHtmlContent(text, file.name);

    // Auto-guess type from title or filename
    let type: ChapterType = 'chapter';
    const lowerName = (file.name + ' ' + parsed.title).toLowerCase();
    if (lowerName.includes('prolog') || lowerName.includes('intro')) {
      type = 'prologue';
    } else if (lowerName.includes('epilog') || lowerName.includes('conclus')) {
      type = 'epilogue';
    } else if (lowerName.includes('interlud')) {
      type = 'interlude';
    } else if (lowerName.includes('append')) {
      type = 'appendix';
    }

    return {
      id: `chapter-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      fileName: file.name,
      title: parsed.title,
      subtitle: parsed.subtitle,
      rawHtml: text,
      type,
      level: 1,
      wordCount: parsed.wordCount,
      estimatedReadMinutes: parsed.estimatedReadMinutes,
      hasInteractiveElements: parsed.hasInteractiveElements,
      interactiveDetails: parsed.interactiveDetails,
    };
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setErrorMsg(null);

    const htmlFiles = Array.from(files).filter((f) =>
      f.name.endsWith('.html') || f.name.endsWith('.htm') || f.type === 'text/html'
    );

    if (htmlFiles.length === 0) {
      setErrorMsg('Seleziona almeno un file con estensione .html o .htm.');
      return;
    }

    try {
      const processed = await Promise.all(htmlFiles.map(processFile));
      setPendingFiles((prev) => [...prev, ...processed]);
    } catch {
      setErrorMsg('Si è verificato un errore durante la lettura dei file HTML.');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const removePendingFile = (id: string) => {
    setPendingFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const updatePendingTitle = (id: string, newTitle: string) => {
    setPendingFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, title: newTitle } : f))
    );
  };

  const updatePendingType = (id: string, newType: ChapterType) => {
    setPendingFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, type: newType } : f))
    );
  };

  const updatePendingLevel = (id: string, newLevel: 1 | 2 | 3) => {
    setPendingFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, level: newLevel } : f))
    );
  };

  const handleConfirmUpload = () => {
    if (activeTab === 'upload') {
      if (pendingFiles.length === 0) return;

      const newChapters: Chapter[] = pendingFiles.map((p, idx) => ({
        id: p.id,
        title: p.title,
        subtitle: p.subtitle,
        rawHtml: p.rawHtml,
        order: existingChapterCount + idx,
        level: p.level,
        type: p.type,
        wordCount: p.wordCount,
        estimatedReadMinutes: p.estimatedReadMinutes,
        hasInteractiveElements: p.hasInteractiveElements,
        interactiveDetails: p.interactiveDetails,
        detectedHeadings: [],
        originalFileName: p.fileName,
      }));

      onAddChapters(newChapters, insertPosition);
      setPendingFiles([]);
      onClose();
    } else {
      // Paste tab
      if (!pasteHtml.trim()) {
        setErrorMsg('Inserisci del codice HTML da salvare come capitolo.');
        return;
      }

      const parsed = parseHtmlContent(pasteHtml);
      const newChapter: Chapter = {
        id: `chapter-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        title: pasteTitle.trim() || parsed.title || 'Nuovo Capitolo',
        subtitle: parsed.subtitle,
        rawHtml: pasteHtml,
        order: existingChapterCount,
        level: pasteLevel,
        type: pasteType,
        wordCount: parsed.wordCount,
        estimatedReadMinutes: parsed.estimatedReadMinutes,
        hasInteractiveElements: parsed.hasInteractiveElements,
        interactiveDetails: parsed.interactiveDetails,
        detectedHeadings: parsed.detectedHeadings,
        originalFileName: 'incollato.html',
      };

      onAddChapters([newChapter], insertPosition);
      setPasteHtml('');
      setPasteTitle('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#FAF8F5] border border-stone-300 rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-6 border-b border-stone-200 flex items-center justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold text-stone-900">
              Aggiungi Capitoli HTML
            </h2>
            <p className="text-xs text-stone-500 mt-1">
              Carica file HTML di testo interattivo. L'indice dinamico li integrerà automaticamente.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-200/50 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="px-6 pt-4 border-b border-stone-200 flex gap-6 text-sm font-medium font-ui">
          <button
            onClick={() => setActiveTab('upload')}
            className={`pb-2.5 transition-colors relative cursor-pointer ${
              activeTab === 'upload'
                ? 'text-stone-900 font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-amber-800'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            Carica File .HTML (Singoli o Multipli)
          </button>
          <button
            onClick={() => setActiveTab('paste')}
            className={`pb-2.5 transition-colors relative cursor-pointer ${
              activeTab === 'paste'
                ? 'text-stone-900 font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-amber-800'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            Incolla Codice HTML Diretto
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {activeTab === 'upload' ? (
            <>
              {/* Drop Zone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-amber-700 bg-amber-50/50 scale-[0.99]'
                    : 'border-stone-300 hover:border-stone-400 bg-white/60'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".html,.htm"
                  className="hidden"
                  onChange={(e) => handleFiles(e.target.files)}
                />
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-stone-100 flex items-center justify-center text-stone-600">
                  <Upload className="w-6 h-6" />
                </div>
                <h3 className="font-serif text-base sm:text-lg font-bold text-stone-900 mb-1">
                  Tocca qui per scegliere i file HTML
                </h3>
                <p className="text-xs text-stone-500 mb-3">
                  Puoi selezionare uno o più file .html contemporaneamente dal telefono
                </p>
                <span className="inline-block px-4 py-2 text-xs font-black uppercase tracking-wider text-stone-950 bg-amber-400 border border-amber-500 rounded-xl shadow-xs">
                  Sfoglia File
                </span>
              </div>

              {/* Pending files list */}
              {pendingFiles.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-stone-600">
                    <span className="font-semibold uppercase tracking-wider">
                      File pronti per l'inserimento ({pendingFiles.length})
                    </span>
                    <button
                      onClick={() => setPendingFiles([])}
                      className="text-stone-500 hover:text-red-700 underline cursor-pointer"
                    >
                      Rimuovi tutti
                    </button>
                  </div>

                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {pendingFiles.map((pf) => (
                      <div
                        key={pf.id}
                        className="bg-white border border-stone-200 rounded-lg p-3 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
                      >
                        <div className="flex items-start gap-2.5 flex-1 min-w-0">
                          <FileCode className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <input
                              type="text"
                              value={pf.title}
                              onChange={(e) => updatePendingTitle(pf.id, e.target.value)}
                              placeholder="Titolo capitolo"
                              className="font-semibold text-stone-900 border-b border-transparent hover:border-stone-300 focus:border-amber-800 focus:outline-none w-full bg-transparent text-xs"
                            />
                            <div className="flex flex-wrap items-center gap-2 text-[11px] text-stone-500 mt-1">
                              <span>{pf.fileName}</span>
                              <span>·</span>
                              <span>{pf.wordCount} parole</span>
                              <span>·</span>
                              <span>~{pf.estimatedReadMinutes} min</span>
                              {pf.hasInteractiveElements && (
                                <>
                                  <span>·</span>
                                  <span className="text-amber-800 font-medium inline-flex items-center gap-1">
                                    <Sparkles className="w-3 h-3" />
                                    Interattivo ({pf.interactiveDetails.join(', ')})
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Controls */}
                        <div className="flex items-center gap-2 shrink-0">
                          <select
                            value={pf.type}
                            onChange={(e) => updatePendingType(pf.id, e.target.value as ChapterType)}
                            className="bg-stone-50 border border-stone-200 rounded px-2 py-1 text-xs text-stone-700"
                          >
                            <option value="chapter">Capitolo</option>
                            <option value="prologue">Prologo</option>
                            <option value="interlude">Interludio</option>
                            <option value="epilogue">Epilogo</option>
                            <option value="appendix">Appendice</option>
                          </select>

                          <select
                            value={pf.level}
                            onChange={(e) => updatePendingLevel(pf.id, Number(e.target.value) as 1 | 2 | 3)}
                            className="bg-stone-50 border border-stone-200 rounded px-2 py-1 text-xs text-stone-700"
                          >
                            <option value={1}>Livello 1 (Principale)</option>
                            <option value={2}>Livello 2 (Sotto-capitolo)</option>
                          </select>

                          <button
                            onClick={() => removePendingFile(pf.id)}
                            className="p-1 text-stone-400 hover:text-red-600 transition-colors cursor-pointer"
                            title="Rimuovi"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Paste Raw HTML Tab */
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                  Titolo del Capitolo (opzionale se presente nel tag h1 o title)
                </label>
                <input
                  type="text"
                  value={pasteTitle}
                  onChange={(e) => setPasteTitle(e.target.value)}
                  placeholder="Es. Capitolo 5: La Scelta del Fiume"
                  className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2 text-sm text-stone-900 focus:outline-none focus:border-amber-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-stone-600 mb-1">Tipo Capitolo</label>
                  <select
                    value={pasteType}
                    onChange={(e) => setPasteType(e.target.value as ChapterType)}
                    className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2 text-xs text-stone-800 focus:outline-none focus:border-amber-800"
                  >
                    <option value="chapter">Capitolo Ordinario</option>
                    <option value="prologue">Prologo</option>
                    <option value="interlude">Interludio</option>
                    <option value="epilogue">Epilogo</option>
                    <option value="appendix">Appendice</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-600 mb-1">Profondità Indice</label>
                  <select
                    value={pasteLevel}
                    onChange={(e) => setPasteLevel(Number(e.target.value) as 1 | 2 | 3)}
                    className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2 text-xs text-stone-800 focus:outline-none focus:border-amber-800"
                  >
                    <option value={1}>Livello 1 (Voce principale)</option>
                    <option value={2}>Livello 2 (Sotto-sezione indiciata)</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-stone-700">
                    Sorgente HTML Interattivo
                  </label>
                  <span className="text-[11px] text-stone-400">
                    Include stili &lt;style&gt;, &lt;button&gt;, &lt;script&gt;
                  </span>
                </div>
                <textarea
                  rows={9}
                  value={pasteHtml}
                  onChange={(e) => setPasteHtml(e.target.value)}
                  placeholder="<h1>Il Mio Capitolo</h1>&#10;<p>Testo con pulsanti interattivi...</p>&#10;<button>Fai la tua scelta</button>"
                  className="w-full font-mono text-xs bg-white border border-stone-200 rounded-lg p-3 text-stone-900 focus:outline-none focus:border-amber-800"
                />
              </div>
            </div>
          )}

          {/* Insertion Position */}
          <div className="pt-2 border-t border-stone-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="text-stone-600 font-medium">Posizione nell'indice dinamico:</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setInsertPosition('end')}
                className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
                  insertPosition === 'end'
                    ? 'bg-stone-800 text-white font-medium'
                    : 'bg-stone-200/70 text-stone-700 hover:bg-stone-300'
                }`}
              >
                In coda al libro
              </button>
              <button
                type="button"
                onClick={() => setInsertPosition('start')}
                className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
                  insertPosition === 'start'
                    ? 'bg-stone-800 text-white font-medium'
                    : 'bg-stone-200/70 text-stone-700 hover:bg-stone-300'
                }`}
              >
                Inizio libro
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-stone-100 border-t border-stone-200 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-stone-600 hover:text-stone-900 cursor-pointer"
          >
            Annulla
          </button>
          <button
            onClick={handleConfirmUpload}
            disabled={activeTab === 'upload' ? pendingFiles.length === 0 : !pasteHtml.trim()}
            className="px-5 py-2 text-xs font-semibold uppercase tracking-wider text-white bg-amber-900 hover:bg-amber-800 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg shadow-sm hover:shadow transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>
              {activeTab === 'upload'
                ? `Inserisci ${pendingFiles.length} ${pendingFiles.length === 1 ? 'Capitolo' : 'Capitoli'}`
                : 'Crea Capitolo'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
