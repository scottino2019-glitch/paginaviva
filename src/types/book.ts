export type ChapterType = 'chapter' | 'prologue' | 'interlude' | 'epilogue' | 'appendix';

export interface DetectedHeading {
  id: string;
  text: string;
  level: number;
}

export interface Chapter {
  id: string;
  title: string;
  subtitle?: string;
  rawHtml: string;
  order: number;
  level: 1 | 2 | 3; // 1 = Main chapter/part, 2 = Subchapter/Scene, 3 = Subsection
  type: ChapterType;
  wordCount: number;
  estimatedReadMinutes: number;
  hasInteractiveElements: boolean;
  interactiveDetails: string[];
  detectedHeadings: DetectedHeading[];
  notes?: string;
  originalFileName?: string;
}

export type NumberingStyle = 'roman' | 'arabic' | 'simple' | 'none';
export type ReaderTheme = 'paper' | 'sepia' | 'dark' | 'clean';
export type ReaderFontSize = 'sm' | 'base' | 'lg' | 'xl';

export interface BookSettings {
  numberingStyle: NumberingStyle;
  defaultReaderTheme: ReaderTheme;
  fontSize: ReaderFontSize;
  showReadingTime: boolean;
  enableCrossChapterLinks: boolean;
  customPrefix?: string;
}

export interface Book {
  id: string;
  title: string;
  subtitle?: string;
  author: string;
  description: string;
  language: string;
  coverImage?: string;
  coverThemeColor?: string;
  chapters: Chapter[];
  settings: BookSettings;
  createdAt: number;
  updatedAt: number;
}

export type ActiveTab = 'toc' | 'reader' | 'editor' | 'export';
