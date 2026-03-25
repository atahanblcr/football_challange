// tests/unit/normalize.test.ts
import { normalizeText } from '../../src/utils/normalize-text.util';

describe('NormalizeText', () => {
  it('should normalize Turkish characters correctly', () => {
    const input = 'İĞÜŞÖÇ ığüşöç';
    const expected = 'igusoc igusoc'; // Hepsi küçük bekliyoruz
    expect(normalizeText(input)).toBe(expected);
  });

  it('should handle uppercase I and lowercase ı correctly', () => {
    const input = 'ISTANBUL ısparta';
    const expected = 'istanbul isparta';
    expect(normalizeText(input)).toBe(expected);
  });

  it('should trim and lowercase', () => {
    const input = '  MESUT özil  ';
    const expected = 'mesut ozil';
    expect(normalizeText(input)).toBe(expected);
  });
});
