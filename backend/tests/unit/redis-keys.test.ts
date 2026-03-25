// tests/unit/redis-keys.test.ts
import { redisKeys } from '../../src/utils/redis-keys.util';

describe('RedisKeys', () => {
  it('should generate leaderboard keys correctly', () => {
    expect(redisKeys.leaderboard('global', 'weekly')).toBe('leaderboard:global:weekly');
    expect(redisKeys.leaderboard('tr', 'alltime', 'players')).toBe('leaderboard:tr:alltime:players');
  });

  it('should generate autocomplete keys based on first 3 chars', () => {
    expect(redisKeys.autocomplete('player', 'Messi')).toBe('autocomplete:player:mes');
    expect(redisKeys.autocomplete('club', 'Barcelona')).toBe('autocomplete:club:bar');
  });
});
