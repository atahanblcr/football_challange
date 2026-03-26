// tests/setup.ts
const redisMock = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  incr: jest.fn(),
  expire: jest.fn(),
  on: jest.fn(),
  zadd: jest.fn(),
  zrevrange: jest.fn(),
  zrevrank: jest.fn(),
  zscore: jest.fn(),
  zcard: jest.fn(),
  keys: jest.fn().mockResolvedValue([]),
  multi: jest.fn().mockReturnValue({
    zadd: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue([]),
  }),
};

jest.mock('../src/config/redis', () => ({
  redis: redisMock,
}));
