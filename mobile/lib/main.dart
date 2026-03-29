import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'core/constants/app_theme.dart';
import 'core/router/app_router.dart';
import 'core/storage/hive_storage.dart';
import 'core/storage/prefs_storage.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Hive başlat
  await HiveStorage.init();

  // SharedPreferences ön yükleme
  final prefs = await SharedPreferences.getInstance();

  runApp(
    ProviderScope(
      overrides: [
        sharedPreferencesProvider.overrideWithValue(prefs),
      ],
      child: const FootballChallengeApp(),
    ),
  );
}

class FootballChallengeApp extends ConsumerWidget {
  const FootballChallengeApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(appRouterProvider);

    return MaterialApp.router(
      title: 'Football Challenge',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.dark(),
      routerConfig: router,
    );
  }
}
