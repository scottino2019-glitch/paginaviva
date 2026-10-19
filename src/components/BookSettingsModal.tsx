import React, { useState } from 'react';
import { Book, NumberingStyle, ReaderTheme, ReaderFontSize } from '../types/book';
import { X, Check, Settings, BookOpen } from 'lucide-react';

interface BookSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  book: Book;
  onSaveSettings: (updatedBook: Book) => void;
}

export const BookSettingsModal: React.FC<BookSettingsModalProps> = ({
  isOpen,
  onClose,
  book,
  onSaveSettings,
}) => {
  const [title, setTitle] = useState(book.title);
  const [subtitle, setSubtitle] = useState(book.subtitle || '');
  const [author, setAuthor] = useState(book.author);
  const [description, setDescription] = useState(book.description || '');
  const [numberingStyle, setNumberingStyle] = useState<NumberingStyle>(
    book.settings.numberingStyle || 'roman'
  );
  const [customPrefix, setCustomPrefix] = useState(
    book.settings.customPrefix || 'Capitolo'
  );
  const [defaultReaderTheme, setDefaultReaderTheme] = useState<ReaderTheme>(
    book.settings.defaultReaderTheme || 'paper'
  );
  const [fontSize, setFontSize] = useState<ReaderFontSize>(
    book.settings.fontSize || 'base'
  );

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: Book = {
      ...book,
      title: title.trim() || 'Libro Senza Titolo',
      subtitle: subtitle.trim(),
      author: author.trim() || 'Anonimo',
      description: description.trim(),
      settings: {
        ...book.settings,
        numberingStyle,
        customPrefix: customPrefix.trim() || 'Capitolo',
        defaultReaderTheme,
        fontSize,
      },
      updatedAt: Date.now(),
    };
    onSaveSettings(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#FAF8F5] border border-stone-300 rounded-xl shadow-2xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Settings className="w-5 h-5 text-amber-800" />
            <h2 className="font-display text-xl font-bold text-stone-900">
              Impostazioni Libro & Indice Dinamico
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-200/50 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 text-xs font-ui">
          {/* Title & Subtitle */}
          <div>
            <label className="block font-semibold uppercase tracking-wider text-stone-700 mb-1">
              Titolo del Libro
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2 text-sm font-serif font-bold text-stone-900 focus:outline-none focus:border-amber-800"
            />
          </div>

          <div>
            <label className="block font-semibold uppercase tracking-wider text-stone-700 mb-1">
              Sottotitolo / Didascalia
            </label>
            <input
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="Es. Un romanzo interattivo a bivi"
              className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2 text-xs text-stone-700 focus:outline-none focus:border-amber-800"
            />
          </div>

          <div>
            <label className="block font-semibold uppercase tracking-wider text-stone-700 mb-1">
              Autore / Curatore
            </label>
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2 text-xs text-stone-700 focus:outline-none focus:border-amber-800"
            />
          </div>

          {/* Numbering System (Crucial for dynamic index!) */}
          <div className="pt-2 border-t border-stone-200 space-y-3">
            <h3 className="font-semibold uppercase tracking-wider text-stone-700">
              Numerazione dell'Indice Dinamico
            </h3>

            <div className="grid grid-cols-2 gap-2.5">
              <label
                className={`p-3 rounded-lg border cursor-pointer transition-colors flex items-start gap-2 ${
                  numberingStyle === 'roman'
                    ? 'border-amber-800 bg-amber-50/50'
                    : 'border-stone-200 bg-white hover:bg-stone-50'
                }`}
              >
                <input
                  type="radio"
                  name="numbering"
                  checked={numberingStyle === 'roman'}
                  onChange={() => setNumberingStyle('roman')}
                  className="mt-0.5 text-amber-800"
                />
                <div>
                  <div className="font-semibold text-stone-900">Numeri Romani</div>
                  <div className="text-[11px] text-stone-500">Es: Capitolo I, II, III</div>
                </div>
              </label>

              <label
                className={`p-3 rounded-lg border cursor-pointer transition-colors flex items-start gap-2 ${
                  numberingStyle === 'arabic'
                    ? 'border-amber-800 bg-amber-50/50'
                    : 'border-stone-200 bg-white hover:bg-stone-50'
                }`}
              >
                <input
                  type="radio"
                  name="numbering"
                  checked={numberingStyle === 'arabic'}
                  onChange={() => setNumberingStyle('arabic')}
                  className="mt-0.5 text-amber-800"
                />
                <div>
                  <div className="font-semibold text-stone-900">Numeri Arabi</div>
                  <div className="text-[11px] text-stone-500">Es: Capitolo 1, 2, 3</div>
                </div>
              </label>

              <label
                className={`p-3 rounded-lg border cursor-pointer transition-colors flex items-start gap-2 ${
                  numberingStyle === 'simple'
                    ? 'border-amber-800 bg-amber-50/50'
                    : 'border-stone-200 bg-white hover:bg-stone-50'
                }`}
              >
                <input
                  type="radio"
                  name="numbering"
                  checked={numberingStyle === 'simple'}
                  onChange={() => setNumberingStyle('simple')}
                  className="mt-0.5 text-amber-800"
                />
                <div>
                  <div className="font-semibold text-stone-900">Solo Cifra</div>
                  <div className="text-[11px] text-stone-500">Es: 1., 2., 3.</div>
                </div>
              </label>

              <label
                className={`p-3 rounded-lg border cursor-pointer transition-colors flex items-start gap-2 ${
                  numberingStyle === 'none'
                    ? 'border-amber-800 bg-amber-50/50'
                    : 'border-stone-200 bg-white hover:bg-stone-50'
                }`}
              >
                <input
                  type="radio"
                  name="numbering"
                  checked={numberingStyle === 'none'}
                  onChange={() => setNumberingStyle('none')}
                  className="mt-0.5 text-amber-800"
                />
                <div>
                  <div className="font-semibold text-stone-900">Nessun Prefisso</div>
                  <div className="text-[11px] text-stone-500">Mostra solo il titolo</div>
                </div>
              </label>
            </div>

            {numberingStyle !== 'none' && numberingStyle !== 'simple' && (
              <div>
                <label className="block font-medium text-stone-600 mb-1">
                  Prefisso dei Capitoli
                </label>
                <input
                  type="text"
                  value={customPrefix}
                  onChange={(e) => setCustomPrefix(e.target.value)}
                  placeholder="Es. Capitolo, Canto, Parte, Atto, Scena"
                  className="w-full bg-white border border-stone-200 rounded-lg px-3 py-1.5 text-xs text-stone-800 focus:outline-none focus:border-amber-800"
                />
              </div>
            )}
          </div>

          {/* Reader Defaults */}
          <div className="pt-2 border-t border-stone-200 space-y-3">
            <h3 className="font-semibold uppercase tracking-wider text-stone-700">
              Tema di Lettura Predefinito
            </h3>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setDefaultReaderTheme('paper')}
                className={`p-2.5 rounded-lg border text-xs font-medium cursor-pointer transition-colors ${
                  defaultReaderTheme === 'paper'
                    ? 'border-amber-800 bg-[#FAF8F5] text-stone-900 font-bold'
                    : 'border-stone-200 bg-white text-stone-600'
                }`}
              >
                Carta Alabastro
              </button>

              <button
                type="button"
                onClick={() => setDefaultReaderTheme('sepia')}
                className={`p-2.5 rounded-lg border text-xs font-medium cursor-pointer transition-colors ${
                  defaultReaderTheme === 'sepia'
                    ? 'border-amber-800 bg-[#F4ECD8] text-[#433422] font-bold'
                    : 'border-stone-200 bg-white text-stone-600'
                }`}
              >
                Crema Sepia
              </button>

              <button
                type="button"
                onClick={() => setDefaultReaderTheme('dark')}
                className={`p-2.5 rounded-lg border text-xs font-medium cursor-pointer transition-colors ${
                  defaultReaderTheme === 'dark'
                    ? 'border-stone-600 bg-[#181716] text-white font-bold'
                    : 'border-stone-200 bg-white text-stone-600'
                }`}
              >
                Notte Scura
              </button>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="pt-4 border-t border-stone-200 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-stone-600 hover:text-stone-900 cursor-pointer"
            >
              Annulla
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold uppercase tracking-wider text-white bg-amber-900 hover:bg-amber-800 rounded-lg shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Salva Impostazioni</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
