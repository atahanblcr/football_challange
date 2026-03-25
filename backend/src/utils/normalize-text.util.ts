// src/utils/normalize-text.util.ts

/**
 * Türkçe karakterleri ASCII karşılıklarına dönüştürür ve küçük harfe çevirir.
 * Autocomplete ve FTS aramaları için kullanılır.
 */
export const normalizeText = (text: string): string => {
  return text
    .trim()
    .replace(/İ/g, 'i')
    .replace(/I/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/Ğ/g, 'g')
    .replace(/Ü/g, 'u')
    .replace(/Ş/g, 's')
    .replace(/Ö/g, 'o')
    .replace(/Ç/g, 'c')
    .toLowerCase();
};
