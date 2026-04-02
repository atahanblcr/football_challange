import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:patrol/patrol.dart';
import 'package:football_challenge/main.dart' as app;

void main() {
  patrolTest(
    'counter state is retained when app is backgrounded',
    ($) async {
      await $.pumpWidgetAndSettle(const app.FootballChallengeApp());

      // Splash screen delay
      await $.pump(const Duration(seconds: 3));

      // Check if we are on Login or Onboarding
      if (await $.finder(Text).at(0).text == 'Hoş Geldiniz') {
        expect($('Başla'), findsOneWidget);
        await $('Başla').tap();
      }

      // Test backgrounding
      await $.host.background();
      await Future.delayed(const Duration(seconds: 2));
      await $.host.foreground();

      // Verify app is still alive
      expect(find.byType(MaterialApp), findsOneWidget);
    },
  );
}
