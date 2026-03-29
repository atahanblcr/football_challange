class LeaderboardEntry {
  final int rank;
  final String userId;
  final String nickname;
  final int score;
  final String? countryCode;
  final String? avatarIndex;

  const LeaderboardEntry({
    required this.rank,
    required this.userId,
    required this.nickname,
    required this.score,
    this.countryCode,
    this.avatarIndex,
  });

  factory LeaderboardEntry.fromJson(Map<String, dynamic> json) {
    return LeaderboardEntry(
      rank: json['rank'] as int,
      userId: json['userId'] as String,
      nickname: json['nickname'] as String,
      score: json['score'] as int,
      countryCode: json['countryCode'] as String?,
      avatarIndex: json['avatarIndex']?.toString(),
    );
  }
}

class LeaderboardResponse {
  final List<LeaderboardEntry> items;
  final int totalCount;
  final LeaderboardEntry? myEntry;

  const LeaderboardResponse({
    required this.items,
    required this.totalCount,
    this.myEntry,
  });

  factory LeaderboardResponse.fromJson(Map<String, dynamic> json) {
    return LeaderboardResponse(
      items: (json['items'] as List).map((e) => LeaderboardEntry.fromJson(e)).toList(),
      totalCount: json['totalCount'] as int,
      myEntry: json['myEntry'] != null ? LeaderboardEntry.fromJson(json['myEntry']) : null,
    );
  }
}
