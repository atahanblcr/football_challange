// tests/setup.ts
jest.mock('../src/config/redis', () => ({
  redis: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    incr: jest.fn(),
    expire: jest.fn(),
    on: jest.fn(),
  },
}));
