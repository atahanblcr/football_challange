// src/jobs/index.ts
import cron from 'node-cron';

export function startAllJobs() {
  console.log('Cron işleri başlatılıyor...');
  
  // Örnek: Her gün gece yarısı (UTC+3 00:00)
  // cron.schedule('0 0 * * *', () => { ... }, { timezone: 'Europe/Istanbul' });
}
