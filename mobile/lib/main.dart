import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:google_mobile_ads/google_mobile_ads.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'firebase_options.dart';
import 'core/constants/app_theme.dart';
import 'core/router/app_router.dart';
import 'core/storage/hive_storage.dart';
import 'core/storage/prefs_storage.dart';

// Firebase arka plan mesaj yöneticisi
@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );
  debugPrint("Handling a background message: ${message.messageId}");
}

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Firebase
  try {
    await Firebase.initializeApp(
      options: DefaultFirebaseOptions.currentPlatform,
    );
    FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);
  } catch (e) {
    debugPrint('Firebase initialization skipped: $e');
  }

  // AdMob
  try {
    MobileAds.instance.initialize();
  } catch (e) {
    debugPrint('AdMob initialization failed: $e');
  }

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
