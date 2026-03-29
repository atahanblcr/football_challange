enum AnswerRowStatus { correct, blurred, wrong }

class AnswerRow {
  final int rank;
  final AnswerRowStatus status;
  final String? entityName;
  final String? statDisplay;
  final String? countryCode;

  const AnswerRow({
    required this.rank,
    required this.status,
    this.entityName,
    this.statDisplay,
    this.countryCode,
  });

  factory AnswerRow.fromJson(Map<String, dynamic> json) {
    // Backend uses 'isCorrect' and 'blurred' boolean logic
    final isCorrect = json['isCorrect'] as bool? ?? false;
    final isBlurred = json['blurred'] as bool? ?? false;
    
    AnswerRowStatus status = AnswerRowStatus.wrong;
    if (isCorrect) status = AnswerRowStatus.correct;
    else if (isBlurred) status = AnswerRowStatus.blurred;

    return AnswerRow(
      rank: json['rank'] as int,
      status: status,
      entityName: json['entity']?['name'] as String?,
      statDisplay: json['statDisplay'] as String?,
      countryCode: json['entity']?['countryCode'] as String?,
    );
  }
}

class SessionResult {
  final String sessionId;
  final String questionTitle;
  final int scoreBase;
  final int scoreTimeBonus;
  final int scoreDifficulty;
  final int scoreFinal;
  final bool adMultiplied;
  final List<AnswerRow> answers;
  final int wrongAnswersCount;

  const SessionResult({
    required this.sessionId,
    required this.questionTitle,
    required this.scoreBase,
    required this.scoreTimeBonus,
    required this.scoreDifficulty,
    required this.scoreFinal,
    required this.adMultiplied,
    required this.answers,
    required this.wrongAnswersCount,
  });

  factory SessionResult.fromJson(Map<String, dynamic> json) {
    return SessionResult(
      sessionId: json['sessionId'] as String,
      questionTitle: json['questionTitle'] as String,
      scoreBase: json['score']['base'] as int,
      scoreTimeBonus: json['score']['timeBonus'] as int,
      scoreDifficulty: json['score']['difficulty'] as int,
      scoreFinal: json['score']['final'] as int,
      adMultiplied: json['adMultiplied'] as bool? ?? false,
      answers: (json['answers'] as List).map((e) => AnswerRow.fromJson(e)).toList(),
      wrongAnswersCount: json['wrongAnswersCount'] as int? ?? 0,
    );
  }
}
