import 'package:flutter_test/flutter_test.dart';
import 'package:football_challenge/features/result/domain/result_model.dart';

void main() {
  group('Scoring and Reward Tests', () {
    test('SessionResult.fromJson should calculate correct status', () {
      final json = {
        'sessionId': 's1',
        'questionTitle': 'Title',
        'score': {
          'base': 100,
          'timeBonus': 20,
          'difficulty': 150,
          'final': 225,
        },
        'adMultiplied': true,
        'wrongAnswersCount': 0,
        'answers': [
          {
            'rank': 1,
            'isCorrect': true,
            'blurred': false,
            'entity': {'name': 'Messi', 'countryCode': 'AR'},
            'statDisplay': '100'
          }
        ]
      };
      final r = SessionResult.fromJson(json);
      expect(r.answers[0].status, AnswerRowStatus.correct);
    });
  });
}
