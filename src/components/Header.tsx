import React, { useState } from 'react';
import { Book } from '../types/book';
import { Upload, Trash2, AlertTriangle } from 'lucide-react';

interface HeaderProps {
  book: Book;
  onOpenUpload: () => void;
  onResetEmpty: () => void;
  onUpdateBookTitle: (newTitle: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  book,
  onOpenUpload,
  onResetEmpty,
  onUpdateBookTitle,
}) => {
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 bg-stone-900 border-b-2 border-amber-600 text-white shadow-md flex-shrink-0">
        <div className="max-w-2xl mx-auto px-3 h-14 flex items-center justify-between gap-2">
          {/* Brand & Book Title */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="font-serif font-black text-lg text-amber-400 tracking-tight whitespace-nowrap">
              PaginaViva
            </span>

            {/* Editable Title on Tap */}
            <div className="min-w-0 flex-1">
              {isEditingTitle ? (
                <input
                  type="text"
                  value={book.title}
                  onChange={(e) => onUpdateBookTitle(e.target.value)}
                  onBlur={() => setIsEditingTitle(false)}
                  onKeyDown={(e) => e.key === 'Enter' && setIsEditingTitle(false)}
                  autoFocus
                  className="bg-stone-800 text-white text-xs font-bold px-2 py-1 rounded border border-amber-400 w-full focus:outline-none"
                />
              ) : (
                <button
                  onClick={() => setIsEditingTitle(true)}
                  className="text-left text-xs font-semibold text-stone-300 hover:text-white truncate max-w-[140px] sm:max-w-[220px] block py-1 cursor-pointer"
                  title="Tocca per rinominare il libro"
                >
                  {book.title || 'Tocca per dare un titolo'}
                </button>
              )}
            </div>
          </div>

          {/* Right Mobile Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Big Yellow CTA: Carica HTML */}
            <button
              onClick={onOpenUpload}
              className="px-3 py-1.5 text-xs font-extrabold uppercase tracking-wide text-stone-950 bg-amber-400 hover:bg-amber-300 active:scale-95 rounded-lg shadow transition-all flex items-center gap-1.5 cursor-pointer border border-amber-300 min-h-[38px]"
            >
              <Upload className="w-4 h-4 stroke-[2.5]" />
              <span>Carica HTML</span>
            </button>

            {/* Svuota Tutto (modal-based) */}
            <button
              onClick={() => setShowConfirmReset(true)}
              className="p-2 text-stone-400 hover:text-red-400 hover:bg-stone-800 rounded-lg transition-colors cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center"
              title="Svuota tutto e inizia da zero"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* In-App Confirmation Modal for "Svuota Tutto" */}
      {showConfirmReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full shadow-2xl text-stone-900 space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold">Vuoi svuotare il libro?</h3>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed">
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
                onClick={() => {
                  onResetEmpty();
                  setShowConfirmReset(false);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm min-h-[44px]"
              >
                Sì, Svuota Tutto
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
