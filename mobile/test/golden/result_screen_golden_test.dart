import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:golden_toolkit/golden_toolkit.dart';
import 'package:mocktail/mocktail.dart';
import 'package:football_challenge/features/result/presentation/result_screen.dart';
import 'package:football_challenge/features/result/presentation/result_provider.dart';
import 'package:football_challenge/features/result/domain/result_model.dart';

class MockResultRepository extends Mock {}

void main() {
  group('ResultScreen Golden Tests', () {
    testGoldens('should render ResultScreen correctly', (tester) async {
      final mockResult = SessionResult(
        sessionId: 'test_session',
        questionTitle: 'La Liga En Çok Asist Yapanlar',
        scoreBase: 80,
        scoreTimeBonus: 15,
        scoreDifficulty: 120,
        scoreFinal: 120,
        adMultiplied: false,
        wrongAnswersCount: 2,
        answers: [
          ResultAnswer(
            rank: 1,
            entity: ResultEntity(id: '1', name: 'Lionel Messi', imagePath: null),
            statValue: '192',
            statDisplay: '192 asist',
            blurred: false,
            isCorrect: true,
          ),
          ResultAnswer(
            rank: 2,
            blurred: true,
            isCorrect: false,
          ),
        ],
      );

      await tester.pumpWidgetBuilder(
        ProviderScope(
          overrides: [
            sessionResultProvider('test_session').overrideWith((ref) => mockResult),
          ],
          child: const MaterialApp(
            debugShowCheckedModeBanner: false,
            home: ResultScreen(sessionId: 'test_session'),
          ),
        ),
        surfaceSize: const Size(390, 844), // iPhone 13/14 size
      );

      await screenMatchesGolden(tester, 'result_screen_initial');
    });
  });
}
