class GameSession {
  final String sessionId;
  final String questionId;
  final String questionTitle;
  final String module;
  final String difficulty;
  final int answerCount;
  final int timeLimit;
  final DateTime startedAt;

  const GameSession({
    required this.sessionId,
    required this.questionId,
    required this.questionTitle,
    required this.module,
    required this.difficulty,
    required this.answerCount,
    required this.timeLimit,
    required this.startedAt,
  });

  factory GameSession.fromJson(Map<String, dynamic> json) {
    return GameSession(
      sessionId: json['sessionId'] as String,
      questionId: json['questionId'] as String? ?? '',
      questionTitle: json['questionTitle'] as String? ?? 'Challenge',
      module: json['module'] as String? ?? '',
      difficulty: json['difficulty'] as String? ?? '',
      answerCount: json['answerCount'] as int? ?? 0,
      timeLimit: json['timeLimit'] as int? ?? 60,
      startedAt: json['startedAt'] != null 
          ? DateTime.parse(json['startedAt'] as String)
          : DateTime.now(),
    );
  }

  GameSession copyWith({
    String? module,
    String? difficulty,
    int? answerCount,
    int? timeLimit,
  }) {
    return GameSession(
      sessionId: sessionId,
      questionId: questionId,
      questionTitle: questionTitle,
      module: module ?? this.module,
      difficulty: difficulty ?? this.difficulty,
      answerCount: answerCount ?? this.answerCount,
      timeLimit: timeLimit ?? this.timeLimit,
      startedAt: startedAt,
    );
  }
}
