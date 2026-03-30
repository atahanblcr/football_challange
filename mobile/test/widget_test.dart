import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:football_challenge/main.dart';
import 'package:football_challenge/core/storage/prefs_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  testWidgets('App should start without error', (WidgetTester tester) async {
    SharedPreferences.setMockInitialValues({});
    final prefs = await SharedPreferences.getInstance();

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          sharedPreferencesProvider.overrideWithValue(prefs),
        ],
        child: const FootballChallengeApp(),
      ),
    );

    await tester.pumpAndSettle();

    expect(find.byType(FootballChallengeApp), findsOneWidget);
  });
}
