class DailyQuestion {
  final String id;
  final String module;
  final String difficulty;
  final int answerCount;
  final int timeLimit;
  final bool isCompleted;
  final bool isSpecial;
  final int? score;

  const DailyQuestion({
    required this.id,
    required this.module,
    required this.difficulty,
    required this.answerCount,
    required this.timeLimit,
    required this.isCompleted,
    required this.isSpecial,
    this.score,
  });

  factory DailyQuestion.fromJson(Map<String, dynamic> json) {
    return DailyQuestion(
      id: json['id'] as String,
      module: json['module'] as String,
      difficulty: json['difficulty'] as String,
      answerCount: json['answerCount'] as int,
      timeLimit: json['timeLimit'] as int,
      isCompleted: json['isCompleted'] as bool? ?? false,
      isSpecial: json['isSpecial'] as bool? ?? false,
      score: json['score'] as int?,
    );
  }
}
