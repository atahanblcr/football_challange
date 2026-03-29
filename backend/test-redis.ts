
import { redis } from './src/config/redis';

async function test() {
  try {
    console.log('Testing Redis connection...');
    await redis.set('test_key', 'test_value');
    const val = await redis.get('test_key');
    console.log('Redis SET/GET successful:', val);
    await redis.del('test_key');
  } catch (error) {
    console.error('Redis failed with error:', error);
  } finally {
    await redis.disconnect();
  }
}

test();
