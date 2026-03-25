// src/modules/search/search.service.ts
import { prisma } from '../../config/database';
import { redis } from '../../config/redis';
import { redisKeys } from '../../utils/redis-keys.util';
import { normalizeText } from '../../utils/normalize-text.util';

export class SearchService {
  /**
   * Entity'ler içinde Full-Text Search araması yapar.
   * Önce Redis cache kontrol edilir, yoksa DB'den çekilir ve cache'lenir.
   */
  async searchEntities(query: string, type: string) {
    if (!query || query.length < 2) return [];

    const normalizedQuery = normalizeText(query);
    const cacheKey = redisKeys.autocomplete(type, normalizedQuery);

    // 1. Redis Cache Kontrolü
    const cachedResults = await redis.get(cacheKey);
    if (cachedResults) {
      return JSON.parse(cachedResults);
    }

    // 2. PostgreSQL FTS Sorgusu (Raw Query)
    // to_tsvector('simple', ...) kullanarak normalizasyon fonksiyonumuzla uyumlu arama yapıyoruz.
    const results = await prisma.$queryRawUnsafe(`
      SELECT id, name, "nameTr", "countryCode", "imagePath", type
      FROM "Entity"
      WHERE type::text = $1
        AND "isActive" = true
        AND (
          to_tsvector('simple', normalize_turkish(name || ' ' || array_to_string(alias, ' ')))
          @@ plainto_tsquery('simple', normalize_turkish($2))
          OR normalize_turkish(name) LIKE normalize_turkish($3)
        )
      ORDER BY ts_rank(
        to_tsvector('simple', normalize_turkish(name || ' ' || array_to_string(alias, ' '))),
        plainto_tsquery('simple', normalize_turkish($2))
      ) DESC
      LIMIT 6
    `, type, query, `%${query}%`);

    // 3. Sonuçları Redis'e Yaz (TTL: 5 Dakika)
    if (Array.isArray(results) && results.length > 0) {
      await redis.set(cacheKey, JSON.stringify(results), 'EX', 300);
    }

    return results;
  }
}
