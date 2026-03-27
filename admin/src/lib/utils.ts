// src/lib/utils.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Tailwind sınıflarını birleştir
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Modül etiketi
export const MODULE_LABELS: Record<string, string> = {
  players: '⚽ Oyuncular',
  clubs: '🏟️ Kulüpler',
  nationals: '🌍 Milli Takımlar',
  managers: '👔 Teknik Direktörler',
};

// Zorluk etiketi + renk
export const DIFFICULTY_CONFIG: Record<string, { label: string; color: string }> = {
  easy:   { label: '⭐☆☆ Kolay',  color: 'text-green-400' },
  medium: { label: '⭐⭐☆ Orta',  color: 'text-yellow-400' },
  hard:   { label: '⭐⭐⭐ Zor',  color: 'text-red-400' },
};

// Durum etiketi + renk
export const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  active:    { label: 'Aktif',    color: 'bg-green-500/20 text-green-400' },
  draft:     { label: 'Taslak',   color: 'bg-gray-500/20 text-gray-400' },
  archived:  { label: 'Arşiv',   color: 'bg-orange-500/20 text-orange-400' },
  archiving: { label: 'Arşivleniyor', color: 'bg-yellow-500/20 text-yellow-400' },
  special:   { label: 'Özel',    color: 'bg-purple-500/20 text-purple-400' },
};

// Tarih formatlama
export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('tr-TR', {
    day: '2-digit', month: 'long', year: 'numeric',
  });
}

// Sayı formatlama
export function formatNumber(n: number): string {
  return n.toLocaleString('tr-TR');
}
