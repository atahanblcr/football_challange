import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:football_challenge/features/game/presentation/game_screen.dart';

void main() {
  testWidgets('GameScreen should show loading when no session', (WidgetTester tester) async {
    await tester.pumpWidget(const ProviderScope(
      child: MaterialApp(
        home: GameScreen(sessionId: 's1'),
      ),
    ));

    expect(find.byType(CircularProgressIndicator), findsOneWidget);
  });
}
