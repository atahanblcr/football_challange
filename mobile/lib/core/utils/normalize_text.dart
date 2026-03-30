String normalizeText(String text) {
  return text
      .trim()
      .toLowerCase()
      .replaceAll('i̇', 'i') // Combined dot
      .replaceAll('ı', 'i')
      .replaceAll('ş', 's')
      .replaceAll('ğ', 'g')
      .replaceAll('ç', 'c')
      .replaceAll('ö', 'o')
      .replaceAll('ü', 'u')
      .replaceAll(RegExp(r'[^a-z0-9 ]'), '');
}
