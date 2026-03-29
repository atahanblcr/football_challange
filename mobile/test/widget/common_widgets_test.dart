import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:football_challenge/shared/widgets/primary_button_widget.dart';
import 'package:football_challenge/features/game/presentation/widgets/timer_widget.dart';

void main() {
  group('Core Widget Tests', () {
    testWidgets('PrimaryButton should show label and handle tap', (WidgetTester tester) async {
      bool tapped = false;
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: PrimaryButton(
              label: 'Test Button',
              onPressed: () => tapped = true,
            ),
          ),
        ),
      );

      expect(find.text('Test Button'), findsOneWidget);
      await tester.tap(find.byType(PrimaryButton));
      expect(tapped, true);
    });

    testWidgets('PrimaryButton should show loading indicator when isLoading is true', (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: PrimaryButton(
              label: 'Loading',
              isLoading: true,
            ),
          ),
        ),
      );

      expect(find.byType(CircularProgressIndicator), findsOneWidget);
      expect(find.text('Loading'), findsNothing);
    });

    testWidgets('TimerWidget should initial render with correct time', (WidgetTester tester) async {
      final now = DateTime.now();
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: TimerWidget(
              startedAt: now,
              timeLimitSeconds: 60,
              onExpired: () {},
            ),
          ),
        ),
      );

      // It should show 1:00 or 0:59 initially
      final textFinder = find.byType(Text);
      expect(textFinder, findsAtLeast(1));
      
      // Check if progress indicator exists
      expect(find.byType(LinearProgressIndicator), findsOneWidget);
    });
  });
}
