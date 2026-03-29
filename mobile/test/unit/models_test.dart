import 'package:flutter_test/flutter_test.dart';
import 'package:football_challenge/features/auth/domain/user_model.dart';
import 'package:football_challenge/features/home/domain/daily_question_model.dart';
import 'package:football_challenge/features/game/domain/game_session_model.dart';
import 'package:football_challenge/features/result/domain/result_model.dart';

void main() {
  group('Model JSON Parsing Tests', () {
    test('User.fromJson should parse correctly', () {
      final json = {
        'id': 'u1',
        'nickname': 'TestUser',
        'email': 'test@example.com',
        'avatarIndex': 5,
        'countryCode': 'TR',
        'isBanned': false,
      };
      final user = User.fromJson(json);
      expect(user.id, 'u1');
      expect(user.nickname, 'TestUser');
      expect(user.avatarIndex, '5');
      expect(user.countryCode, 'TR');
    });

    test('DailyQuestion.fromJson should parse correctly', () {
      final json = {
        'id': 'q1',
        'module': 'players',
        'difficulty': 'hard',
        'answerCount': 10,
        'timeLimit': 60,
        'isCompleted': true,
        'isSpecial': false,
        'score': 150,
      };
      final q = DailyQuestion.fromJson(json);
      expect(q.id, 'q1');
      expect(q.module, 'players');
      expect(q.score, 150);
      expect(q.isCompleted, true);
    });

    test('GameSession.fromJson should parse correctly', () {
      final json = {
        'sessionId': 's1',
        'questionTitle': 'Who am I?',
        'module': 'clubs',
        'difficulty': 'easy',
        'answerCount': 5,
        'timeLimit': 30,
        'startedAt': '2026-03-29T12:00:00.000Z',
      };
      final s = GameSession.fromJson(json);
      expect(s.sessionId, 's1');
      expect(s.questionTitle, 'Who am I?');
      expect(s.timeLimit, 30);
      expect(s.startedAt.year, 2026);
    });

    test('SessionResult.fromJson should parse correctly', () {
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
        'wrongAnswersCount': 2,
        'answers': [
          {
            'rank': 1,
            'isCorrect': true,
            'blurred': false,
            'entity': {'name': 'Messi', 'countryCode': 'AR'},
            'statDisplay': '100 goals'
          }
        ]
      };
      final r = SessionResult.fromJson(json);
      expect(r.scoreFinal, 225);
      expect(r.answers.length, 1);
      expect(r.answers[0].entityName, 'Messi');
      expect(r.answers[0].status, AnswerRowStatus.correct);
    });
  });
}
