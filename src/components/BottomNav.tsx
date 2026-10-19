import React from 'react';
import { ListOrdered, BookOpen, Download } from 'lucide-react';

export type MobileTab = 'index' | 'reader' | 'export';

interface BottomNavProps {
  currentTab: MobileTab;
  onTabChange: (tab: MobileTab) => void;
  chapterCount: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onTabChange,
  chapterCount,
}) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-stone-900 border-t-2 border-amber-600 text-stone-300 shadow-2xl pb-safe">
      <div className="grid grid-cols-3 items-center h-16 max-w-md mx-auto px-2">
        {/* Tab 1: Indice Pagine */}
        <button
          onClick={() => onTabChange('index')}
          className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all min-h-[48px] cursor-pointer ${
            currentTab === 'index'
              ? 'text-amber-400 font-bold bg-stone-800'
              : 'text-stone-400 hover:text-white'
          }`}
        >
          <div className="relative">
            <ListOrdered className="w-5 h-5" />
            {chapterCount > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-amber-500 text-stone-950 text-[10px] font-black rounded-full px-1.5 leading-tight">
                {chapterCount}
              </span>
            )}
          </div>
          <span className="text-xs mt-1">Indice Pagine</span>
        </button>

        {/* Tab 2: Leggi / Anteprima */}
        <button
          onClick={() => onTabChange('reader')}
          className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all min-h-[48px] cursor-pointer ${
            currentTab === 'reader'
              ? 'text-amber-400 font-bold bg-stone-800'
              : 'text-stone-400 hover:text-white'
          }`}
        >
          <BookOpen className="w-5 h-5" />
          <span className="text-xs mt-1">Leggi Pagina</span>
        </button>

        {/* Tab 3: Scarica Libro */}
        <button
          onClick={() => onTabChange('export')}
          className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all min-h-[48px] cursor-pointer ${
            currentTab === 'export'
              ? 'text-amber-400 font-bold bg-stone-800'
              : 'text-stone-400 hover:text-white'
          }`}
        >
          <Download className="w-5 h-5" />
          <span className="text-xs mt-1">Scarica (.html)</span>
        </button>
      </div>
    </nav>
  );
};
