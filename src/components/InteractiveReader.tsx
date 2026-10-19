import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Book, ReaderTheme, ReaderFontSize, ActiveTab } from '../types/book';
import { buildReaderDocument } from '../utils/htmlParser';
import { formatChapterNumber } from '../utils/romanNumerals';
import {
  List,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  X,
  FileCode
} from 'lucide-react';

interface InteractiveReaderProps {
  book: Book;
  currentChapterId: string;
  onSelectChapter: (chapterId: string) => void;
  onNavigateTab: (tab: ActiveTab) => void;
}

export const InteractiveReader: React.FC<InteractiveReaderProps> = ({
  book,
  currentChapterId,
  onSelectChapter,
  onNavigateTab,
}) => {
  const [theme, setTheme] = useState<ReaderTheme>(book.settings.defaultReaderTheme || 'paper');
  const [fontSize, setFontSize] = useState<ReaderFontSize>(book.settings.fontSize || 'base');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Current chapter and index
  const currentIndex = Math.max(
    0,
    book.chapters.findIndex((c) => c.id === currentChapterId)
  );
  const currentChapter = book.chapters[currentIndex] || book.chapters[0];

  // Dynamic chapter label
  const chapterSequenceIndex = currentChapter
    ? book.chapters.slice(0, currentIndex + 1).filter((c) => c.type === currentChapter.type).length
    : 1;
  const currentChapterLabel = currentChapter
    ? formatChapterNumber(
        currentChapter,
        chapterSequenceIndex,
        book.settings.numberingStyle,
        book.settings.customPrefix
      )
    : '';

  // Generate reader document HTML
  const readerDocumentHtml = useMemo(() => {
    if (!currentChapter) return '';
    return buildReaderDocument(currentChapter.rawHtml, currentChapter.id, theme, fontSize);
  }, [currentChapter, theme, fontSize]);

  // Listen to postMessage from sandboxed iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const data = event.data;
      if (!data) return;

      if (data.type === 'PAGINAVIVA_NAVIGATE') {
        const targetId = data.chapterId;
        const exists = book.chapters.find((c) => c.id === targetId);
        if (exists) {
          onSelectChapter(targetId);
        }
      } else if (data.type === 'PAGINAVIVA_NAVIGATE_REF') {
        const ref = String(data.ref).toLowerCase();
        const found = book.chapters.find(
          (c) =>
            c.id.toLowerCase() === ref ||
            c.title.toLowerCase().includes(ref) ||
            (c.originalFileName && c.originalFileName.toLowerCase().includes(ref))
        );
        if (found) {
          onSelectChapter(found.id);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [book.chapters, onSelectChapter]);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      onSelectChapter(book.chapters[currentIndex - 1].id);
    }
  };

  const handleNext = () => {
    if (currentIndex < book.chapters.length - 1) {
      onSelectChapter(book.chapters[currentIndex + 1].id);
    }
  };

  if (!currentChapter) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
        <FileCode className="w-12 h-12 text-stone-400" />
        <h3 className="font-serif font-bold text-lg text-stone-900">Nessuna pagina da leggere</h3>
        <p className="text-xs text-stone-600 max-w-xs">
          Aggiungi o carica prima i file HTML del tuo libro nella scheda "Indice Pagine".
        </p>
      </div>
    );
  }

  const themeClasses = {
    paper: 'bg-[#FAF8F5] text-stone-900',
    sepia: 'bg-[#F4ECD8] text-[#433422]',
    dark: 'bg-[#181716] text-[#E7E2DF]',
    clean: 'bg-white text-slate-900',
  }[theme];

  return (
    <div ref={containerRef} className={`flex-1 flex flex-col h-full overflow-hidden ${themeClasses}`}>
      {/* Compact Reader Sub-Header */}
      <div className="px-3 py-2 border-b border-stone-200/80 bg-stone-100 flex items-center justify-between gap-2 z-20 flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="px-2.5 py-1.5 text-xs font-bold text-stone-800 bg-white border border-stone-300 rounded-lg flex items-center gap-1 cursor-pointer shrink-0"
          >
            <List className="w-4 h-4 text-amber-700" />
            <span>Indice</span>
          </button>

          <div className="text-xs font-bold truncate">
            {currentChapterLabel && <span className="text-amber-800 mr-1">{currentChapterLabel}:</span>}
            <span className="truncate">{currentChapter.title}</span>
          </div>
        </div>

        {/* Theme quick selector */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setTheme(theme === 'paper' ? 'sepia' : theme === 'sepia' ? 'dark' : 'paper')}
            className="px-2 py-1 text-xs font-semibold bg-white border border-stone-300 rounded-lg"
            title="Cambia tema"
          >
            {theme === 'paper' ? '📜 Carta' : theme === 'sepia' ? '🏺 Sepia' : '🌙 Notte'}
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-1.5 text-stone-700 bg-white border border-stone-300 rounded-lg hidden sm:block"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Iframe Viewer Container */}
      <div className="flex-1 relative overflow-hidden">
        <iframe
          ref={iframeRef}
          srcDoc={readerDocumentHtml}
          sandbox="allow-scripts allow-forms allow-same-origin"
          title={currentChapter.title}
          className="w-full h-full border-0 bg-transparent"
        />

        {/* Floating Prev/Next Controls (Above bottom bar, safe for phone thumbs) */}
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-stone-900/95 text-white backdrop-blur-md shadow-2xl flex items-center gap-3 text-xs z-30 border border-stone-700">
          <button
            onClick={handlePrev}
            disabled={currentIndex <= 0}
            className="flex items-center gap-1 p-1 hover:text-amber-300 disabled:opacity-25 transition-colors cursor-pointer min-h-[36px]"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="font-bold">Precedente</span>
          </button>

          <span className="opacity-70 tabular-nums text-[11px] font-bold border-x border-stone-700 px-2">
            {currentIndex + 1} / {book.chapters.length}
          </span>

          <button
            onClick={handleNext}
            disabled={currentIndex >= book.chapters.length - 1}
            className="flex items-center gap-1 p-1 hover:text-amber-300 disabled:opacity-25 transition-colors cursor-pointer min-h-[36px]"
          >
            <span className="font-bold">Successiva</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Drawer Indice for Mobile */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/60" onClick={() => setIsSidebarOpen(false)} />
          <div className="relative w-72 max-w-[80vw] bg-stone-900 text-white h-full flex flex-col shadow-2xl z-50">
            <div className="p-4 border-b border-stone-800 flex items-center justify-between">
              <h3 className="font-serif font-bold text-base text-amber-400">Indice del Libro</h3>
              <button onClick={() => setIsSidebarOpen(false)} className="p-1 text-stone-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {book.chapters.map((ch, idx) => {
                const isActive = ch.id === currentChapter.id;
                return (
                  <button
                    key={ch.id}
                    onClick={() => {
                      onSelectChapter(ch.id);
                      setIsSidebarOpen(false);
                    }}
                    style={{ paddingLeft: ch.level === 2 ? '1.5rem' : '0.75rem' }}
                    className={`w-full text-left p-2.5 rounded-xl text-xs font-medium flex items-center justify-between cursor-pointer ${
                      isActive ? 'bg-amber-600 text-white font-bold' : 'hover:bg-stone-800 text-stone-300'
                    }`}
                  >
                    <span className="truncate">{idx + 1}. {ch.title}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
