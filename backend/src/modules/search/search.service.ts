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

    // Mobil uygulamadan gelen çoğul tipleri tekile çevir (managers -> manager vb.)
    const typeMapping: Record<string, string> = {
      'players': 'player',
      'clubs': 'club',
      'nationals': 'national',
      'managers': 'manager'
    };
    const entityType = typeMapping[type] || type;

    const normalizedQuery = normalizeText(query);
    // GEMINI.md 12.2: İlk 3 harfe göre cache'le
    const prefix = normalizedQuery.slice(0, 3);
    const cacheKey = redisKeys.autocomplete(entityType, prefix);

    let results: any[] = [];

    // 1. Redis Cache Kontrolü
    const cachedResults = await redis.get(cacheKey);
    if (cachedResults) {
      results = JSON.parse(cachedResults);
    } else {
      // 2. Cache MISS ise DB'den PREFIX ile çek
      try {
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
        `, entityType, prefix, `%${prefix}%`);
      } catch (e) {
        console.error('Raw Search Error (possibly missing normalize_turkish):', e);
        // Fallback: Prisma findMany (Daha az performanslı ama güvenli)
        results = await prisma.entity.findMany({
          where: {
            type: entityType as any,
            isActive: true,
            OR: [
              { name: { contains: prefix, mode: 'insensitive' } },
              { alias: { hasSome: [prefix] } }
            ]
          },
          take: 100
        });
      }

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
