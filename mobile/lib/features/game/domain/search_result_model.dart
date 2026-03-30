class SearchResult {
  final String entityId;
  final String name;
  final String? clubName;
  final String? countryCode;
  final String? imagePath;

  const SearchResult({
    required this.entityId,
    required this.name,
    this.clubName,
    this.countryCode,
    this.imagePath,
  });

  factory SearchResult.fromJson(Map<String, dynamic> json) {
    return SearchResult(
      entityId: (json['id'] ?? json['entityId']) as String,
      name: json['name'] as String,
      clubName: json['clubName'] as String?,
      countryCode: json['countryCode'] as String?,
      imagePath: json['imagePath'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'entityId': entityId,
      'name': name,
      'clubName': clubName,
      'countryCode': countryCode,
      'imagePath': imagePath,
    };
  }

  SearchResult copyWith({
    String? entityId,
    String? name,
    String? clubName,
    String? countryCode,
    String? imagePath,
  }) {
    return SearchResult(
      entityId: entityId ?? this.entityId,
      name: name ?? this.name,
      clubName: clubName ?? this.clubName,
      countryCode: countryCode ?? this.countryCode,
      imagePath: imagePath ?? this.imagePath,
    );
  }
}
