
import { PrismaClient } from '@prisma/client';
import { redis } from './src/config/redis';
import { redisKeys } from './src/utils/redis-keys.util';

const prisma = new PrismaClient();

async function main() {
  console.log('Fetching users from DB...');
  const users = await prisma.user.findMany({
    take: 20,
    select: { id: true, countryCode: true }
  });

  if (users.length === 0) {
    console.log('No users found in DB. Please run prisma seed first.');
    return;
  }

  console.log(`Found ${users.length} users. Adding scores to Redis...`);

  const scopes = ['global', 'tr'];
  const periods = ['alltime', 'weekly:2026-W14', 'monthly:2026-03', 'quarterly:2026-Q1'];
  const modules = ['players', 'clubs', 'nationals', 'managers'];

  for (const user of users) {
    for (const scope of scopes) {
      if (scope === 'tr' && user.countryCode !== 'TR') continue;

      for (const period of periods) {
        let totalScore = 0;
        
        // 1. Generate and add specific scores for each module
        for (const module of modules) {
          const moduleScore = Math.floor(Math.random() * 2000) + 100;
          totalScore += moduleScore;
          
          const moduleKey = `leaderboard:module:${module}:${scope}:${period}`;
          await redis.zadd(moduleKey, moduleScore.toString(), user.id);
        }

        // 2. Add the accumulated total score to the general key
        const totalKey = `leaderboard:${scope}:${period}`;
        await redis.zadd(totalKey, totalScore.toString(), user.id);
      }
    }
  }

  console.log('Redis seeding completed.');
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
