import { Chapter, NumberingStyle } from '../types/book';

export function toRoman(num: number): string {
  if (num <= 0) return '';
  const romanMap: [number, string][] = [
    [1000, 'M'],
    [900, 'CM'],
    [500, 'D'],
    [400, 'CD'],
    [100, 'C'],
    [90, 'XC'],
    [50, 'L'],
    [40, 'XL'],
    [10, 'X'],
    [9, 'IX'],
    [5, 'V'],
    [4, 'IV'],
    [1, 'I'],
  ];

  let result = '';
  let n = num;
  for (const [val, sym] of romanMap) {
    while (n >= val) {
      result += sym;
      n -= val;
    }
  }
  return result;
}

export function formatChapterNumber(
  chapter: Chapter,
  indexInSequence: number,
  style: NumberingStyle,
  customPrefix = 'Capitolo'
): string {
  if (chapter.type === 'prologue') return 'Prologo';
  if (chapter.type === 'epilogue') return 'Epilogo';
  if (chapter.type === 'interlude') return `Interludio ${indexInSequence}`;
  if (chapter.type === 'appendix') return `Appendice ${toRoman(indexInSequence)}`;

  if (style === 'none') return '';
  if (style === 'roman') {
    return `${customPrefix} ${toRoman(indexInSequence)}`;
  }
  if (style === 'arabic') {
    return `${customPrefix} ${indexInSequence}`;
  }
  if (style === 'simple') {
    return `${indexInSequence}.`;
  }
  return `${indexInSequence}`;
}
