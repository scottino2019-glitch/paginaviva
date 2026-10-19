import React, { useState } from 'react';
import { Book } from '../types/book';
import { exportStandaloneHtmlBook, exportProjectJson, exportZipBundle } from '../utils/exporter';
import {
  Download,
  FileCode,
  Archive,
  Upload,
  Check,
  Sparkles,
  BookOpen,
  RotateCcw,
  Layers,
  Clock
} from 'lucide-react';

interface ExportModalProps {
  book: Book;
  onImportBook: (imported: Book) => void;
  onResetToDemo: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  book,
  onImportBook,
  onResetToDemo,
}) => {
  const [isExportingZip, setIsExportingZip] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  const handleDownloadStandaloneHtml = () => {
    const html = exportStandaloneHtmlBook(book);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const safeTitle = book.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    a.download = `${safeTitle || 'libro-interattivo'}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setDownloadSuccess('File HTML autonomo scaricato con successo!');
    setTimeout(() => setDownloadSuccess(null), 4000);
  };

  const handleDownloadZip = async () => {
    setIsExportingZip(true);
    try {
      const blob = await exportZipBundle(book);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const safeTitle = book.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      a.download = `${safeTitle || 'libro-interattivo'}-archivio.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setDownloadSuccess('Pacchetto ZIP scaricato con capitoli separati e indice!');
      setTimeout(() => setDownloadSuccess(null), 4000);
    } catch {
      alert('Errore durante la creazione dello ZIP.');
    } finally {
      setIsExportingZip(false);
    }
  };

  const handleDownloadJson = () => {
    const json = exportProjectJson(book);
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const safeTitle = book.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    a.download = `${safeTitle || 'libro-interattivo'}-progetto.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setDownloadSuccess('Progetto JSON esportato.');
    setTimeout(() => setDownloadSuccess(null), 4000);
  };

  const handleImportJsonFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text) as Book;
        if (!parsed.chapters || !Array.isArray(parsed.chapters)) {
          alert('Il file non sembra essere un progetto valido di PaginaViva.');
          return;
        }
        onImportBook(parsed);
        setDownloadSuccess('Libro importato con successo!');
        setTimeout(() => setDownloadSuccess(null), 4000);
      } catch {
        alert('Errore nel parsing del file JSON.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="bg-white border border-stone-200 rounded-xl p-6 lg:p-8 shadow-xs">
        <h1 className="font-display text-3xl font-bold tracking-tight text-stone-900">
          Esporta e Distribuisci il tuo Libro
        </h1>
        <p className="text-sm text-stone-600 mt-2 max-w-2xl">
          Tutti i file HTML caricati vengono assemblati con l'indice dinamico in un formato
          autonomo, apribile ovunque anche offline su PC, Mac, tablet o smartphone.
        </p>

        {downloadSuccess && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{downloadSuccess}</span>
          </div>
        )}
      </div>

      {/* Export Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Standalone HTML (Recommended) */}
        <div className="bg-white border-2 border-amber-900/40 rounded-xl p-6 flex flex-col justify-between shadow-xs relative overflow-hidden">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900">
                Consigliato per la lettura
              </span>
              <FileCode className="w-5 h-5 text-amber-900" />
            </div>

            <h2 className="font-display text-xl font-bold text-stone-900">
              Libro HTML Monolitico (.html)
            </h2>

            <p className="text-xs text-stone-600 leading-relaxed">
              Genera un singolo file HTML autonomo al 100% contenente:
            </p>

            <ul className="text-xs text-stone-600 space-y-2 list-disc list-inside">
              <li>Tutti i capitoli HTML caricati e relativi script interattivi</li>
              <li>Indice dinamico laterale a scomparsa responsive</li>
              <li>Temi di lettura (Carta antica, Sepia, Notte, Minimal)</li>
              <li>Navigazione automatica fra bivi e pulsanti</li>
              <li>Zero dipendenze esterne: funziona offline ovunque</li>
            </ul>
          </div>

          <button
            onClick={handleDownloadStandaloneHtml}
            className="mt-6 w-full py-2.5 text-xs font-semibold uppercase tracking-wider text-white bg-amber-900 hover:bg-amber-800 rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
          >
            <Download className="w-4 h-4" />
            <span>Scarica Libro HTML (.html)</span>
          </button>
        </div>

        {/* Card 2: ZIP Package */}
        <div className="bg-white border border-stone-200 rounded-xl p-6 flex flex-col justify-between shadow-xs">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                Archivio Web Completo
              </span>
              <Archive className="w-5 h-5 text-stone-700" />
            </div>

            <h2 className="font-display text-xl font-bold text-stone-900">
              Pacchetto ZIP per Siti Web (.zip)
            </h2>

            <p className="text-xs text-stone-600 leading-relaxed">
              Ideale per pubblicare il libro su un server personale, GitHub Pages o archiviare i singoli capitoli:
            </p>

            <ul className="text-xs text-stone-600 space-y-2 list-disc list-inside">
              <li>File <code className="font-mono text-stone-800">index.html</code> principale di lettura</li>
              <li>Cartella <code className="font-mono text-stone-800">capitoli/</code> con tutti i file HTML singoli numerati</li>
              <li>File di progetto per ripristinare il lavoro</li>
              <li>Istruzioni nel file LEGGIMI.txt</li>
            </ul>
          </div>

          <button
            onClick={handleDownloadZip}
            disabled={isExportingZip}
            className="mt-6 w-full py-2.5 text-xs font-semibold uppercase tracking-wider text-stone-800 bg-stone-100 hover:bg-stone-200 disabled:opacity-50 rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
          >
            <Archive className="w-4 h-4" />
            <span>{isExportingZip ? 'Creazione Archivio...' : 'Scarica Archivio ZIP (.zip)'}</span>
          </button>
        </div>
      </div>

      {/* Backup & Import Section */}
      <div className="bg-white border border-stone-200 rounded-xl p-6 space-y-6 shadow-xs">
        <div>
          <h2 className="font-display text-xl font-bold text-stone-900">
            Salvataggio e Ripristino Progetto
          </h2>
          <p className="text-xs text-stone-600 mt-1">
            Conserva il tuo libro nel formato sorgente per poterlo riaprire e modificare in qualsiasi momento.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 pt-2">
          <button
            onClick={handleDownloadJson}
            className="px-4 py-2 text-xs font-semibold text-stone-800 bg-stone-100 hover:bg-stone-200 rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Esporta File Progetto (.json)</span>
          </button>

          <label className="px-4 py-2 text-xs font-semibold text-stone-800 bg-stone-100 hover:bg-stone-200 rounded-lg flex items-center gap-2 transition-colors cursor-pointer">
            <Upload className="w-4 h-4" />
            <span>Importa Progetto (.json)</span>
            <input
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleImportJsonFile}
            />
          </label>

          <button
            onClick={() => {
              if (confirm('Vuoi ripristinare la guida iniziale di esempio? Le modifiche correnti verranno sostituite.')) {
                onResetToDemo();
                setDownloadSuccess('Guida di esempio ripristinata!');
                setTimeout(() => setDownloadSuccess(null), 3000);
              }
            }}
            className="px-4 py-2 text-xs font-medium text-stone-500 hover:text-stone-800 rounded-lg flex items-center gap-2 transition-colors cursor-pointer ml-auto"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Ripristina Guida Esempio</span>
          </button>
        </div>
      </div>
    </div>
  );
};
