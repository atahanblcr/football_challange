import 'package:flutter_test/flutter_test.dart';
import 'package:football_challenge/core/utils/normalize_text.dart';

void main() {
  group('Text Normalization Tests', () {
    test('Should normalize Turkish characters correctly', () {
      expect(normalizeText('İSTANBUL'), 'istanbul');
      expect(normalizeText('IĞDIR'), 'igdir');
      expect(normalizeText('ŞAMPİYON'), 'sampiyon');
      expect(normalizeText('ÇAYKUR'), 'caykur');
      expect(normalizeText('GÖZTEPE'), 'goztepe');
      expect(normalizeText('ÜMRANİYE'), 'umraniye');
    });

    test('Should handle spaces and case correctly', () {
      expect(normalizeText('  Real Madrid  '), 'real madrid');
      expect(normalizeText('Manchester United'), 'manchester united');
    });

    test('Should handle numbers and special chars', () {
      expect(normalizeText('1905 Galatasaray!'), '1905 galatasaray');
    });
  });
}
