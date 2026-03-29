import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/router/route_names.dart';
import '../../../core/storage/prefs_storage.dart';
import '../../../core/utils/version_utils.dart';
import '../../app_config/presentation/app_config_provider.dart';
import '../../../shared/providers/auth_provider.dart';

class SplashScreen extends ConsumerStatefulWidget {
  const SplashScreen({super.key});

  @override
  ConsumerState<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends ConsumerState<SplashScreen> {
  @override
  void initState() {
    super.initState();
    _initializeApp();
  }

  Future<void> _initializeApp() async {
    // 1. Minimum logo süresi
    final startTime = DateTime.now();

    try {
      // 2. AppConfig çek
      final config = await ref.read(appConfigProvider.future);
      
      // 3. Versiyon kontrolü (Örn: Şu anki versiyon 1.0.0 olsun)
      const currentVersion = '1.0.0';
      if (config.forceUpdate || VersionUtils.compare(currentVersion, config.minimumVersion) < 0) {
        if (mounted) context.go(RouteNames.forceUpdate);
        return;
      }

      // 4. Auth durumunu bekle (AsyncNotifier build olmalı)
      await ref.read(authStateProvider.future);

      // 5. Logo süresini tamamla
      final elapsed = DateTime.now().difference(startTime).inMilliseconds;
      if (elapsed < 2000) {
        await Future.delayed(Duration(milliseconds: 2000 - elapsed));
      }

      if (!mounted) return;

      // 6. Yönlendirme mantığı
      final completed = await PrefsStorage.isOnboardingCompleted();
      final authState = ref.read(authStateProvider).value;

      if (!completed) {
        context.go(RouteNames.onboarding);
      } else if (authState?.isAuthenticated == true) {
        context.go(RouteNames.home);
      } else {
        context.go(RouteNames.login);
      }
    } catch (e) {
      // Hata durumunda (İnternet yok vb.) 2 saniye sonra login'e veya error'a at
      await Future.delayed(const Duration(seconds: 2));
      if (mounted) context.go(RouteNames.login);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Text('⚽', style: TextStyle(fontSize: 80)),
            const SizedBox(height: 24),
            const Text(
              'FOOTBALL CHALLENGE',
              style: TextStyle(
                color: Colors.white,
                fontSize: 24,
                fontWeight: FontWeight.bold,
                letterSpacing: 2,
              ),
            ),
            const SizedBox(height: 48),
            const SizedBox(
              width: 200,
              child: LinearProgressIndicator(
                backgroundColor: AppColors.surface,
                valueColor: AlwaysStoppedAnimation<Color>(AppColors.primary),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
