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
    // GEMINI.md 12.2: İlk 3 harfe göre cache'le
    const prefix = normalizedQuery.slice(0, 3);
    const cacheKey = redisKeys.autocomplete(type, prefix);

    let results: any[] = [];

    // 1. Redis Cache Kontrolü
    const cachedResults = await redis.get(cacheKey);
    if (cachedResults) {
      results = JSON.parse(cachedResults);
    } else {
      // 2. Cache MISS ise DB'den PREFIX ile çek
      // prefix tabanlı cache için prefix ile arayıp hepsini cache'liyoruz.
      // Hem name hem alias içinde prefix araması yapıyoruz.
      results = await prisma.$queryRawUnsafe(`
        SELECT id, name, "nameTr", "countryCode", "imagePath", type, alias
        FROM "Entity"
        WHERE type::text = $1
          AND "isActive" = true
          AND (
            to_tsvector('simple', normalize_turkish(name || ' ' || array_to_string(alias, ' ')))
            @@ to_tsquery('simple', normalize_turkish($2) || ':*')
            OR normalize_turkish(name) ILIKE normalize_turkish($3)
            OR array_to_string(alias, ' ') ILIKE normalize_turkish($3)
          )
        ORDER BY name ASC
        LIMIT 100
      `, type, prefix, `%${prefix}%`);

      if (Array.isArray(results) && results.length > 0) {
        await redis.set(cacheKey, JSON.stringify(results), 'EX', 300);
      }
    }

    // 3. Bellekteki sonuçları asıl query'ye göre filtrele
    const filteredResults = results.filter(e => {
      const normalizedName = normalizeText(e.name);
      const normalizedAliases = (e.alias || []).map((a: string) => normalizeText(a));
      return normalizedName.includes(normalizedQuery) || normalizedAliases.some((a: string) => a.includes(normalizedQuery));
    }).slice(0, 6);

    return filteredResults;
  }
}
