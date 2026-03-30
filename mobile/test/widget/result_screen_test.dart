import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:football_challenge/features/result/presentation/result_screen.dart';

void main() {
  testWidgets('ResultScreen should show loading when no result', (WidgetTester tester) async {
    await tester.pumpWidget(const ProviderScope(
      child: MaterialApp(
        home: ResultScreen(sessionId: 's1'),
      ),
    ));

    expect(find.byType(CircularProgressIndicator), findsOneWidget);
    
    // Allow any pending microtasks/timers to complete or settle
    await tester.pumpAndSettle(const Duration(seconds: 1));
  });
}
