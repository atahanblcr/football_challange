---
name: flutter-architecture
description: Specialized procedural guidance for flutter-architecture in the Football Challenge project.
---

# SKILL: FLUTTER ARCHITECTURE — RIVERPOD + GOROUTER + DIO + FEATURE-BASED YAPI

> Bu skill dosyası Football Challenge Flutter uygulamasının mimari kurallarını tanımlar.
> Riverpod state yönetimi, GoRouter navigasyonu, Dio HTTP istemcisi ve
> feature-based klasör yapısı bu dosyaya göre implemento edilir.
> Buradaki kalıpların dışına çıkılmaz.

---

## 1. PUBSPEC.YAML — TAM BAĞIMLILIKLAR

```yaml
name: football_challenge
description: Football statistics quiz game
publish_to: 'none'
version: 1.0.0+1

environment:
  sdk: '>=3.3.0 <4.0.0'

dependencies:
  flutter:
    sdk: flutter

  # State Management
  flutter_riverpod: ^2.5.1
  riverpod_annotation: ^2.3.5

  # Navigation
  go_router: ^13.2.0

  # HTTP
  dio: ^5.4.3

  # Local Storage
  hive_flutter: ^1.1.0
  shared_preferences: ^2.2.3
  flutter_secure_storage: ^9.0.0

  # Auth
  google_sign_in: ^6.2.1
  sign_in_with_apple: ^6.1.1

  # Ads
  google_mobile_ads: ^5.1.0

  # Animations
  flutter_animate: ^4.5.0

  # Image
  cached_network_image: ^3.3.1

  # Localization
  intl: ^0.19.0

  # Utils
  package_info_plus: ^8.0.0
  url_launcher: ^6.3.0

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^4.0.0
  riverpod_generator: ^2.4.2
  build_runner: ^2.4.9
  hive_generator: ^2.0.1

flutter:
  uses-material-design: true
  assets:
    - assets/images/
    - assets/images/onboarding/
    - assets/avatars/
    - assets/animations/
```

---

## 2. MAIN.DART — UYGULAMA GİRİŞ NOKTASI

```dart
// lib/main.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'core/router/app_router.dart';
import 'core/storage/hive_storage.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Hive başlat
  await HiveStorage.init();

  // SharedPreferences ön yükleme (provider'larda syncronous okuma için)
  final prefs = await SharedPreferences.getInstance();

  runApp(
    ProviderScope(
      overrides: [
        // SharedPreferences'ı Riverpod'a inject et
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
      theme: AppTheme.dark(), // Sadece dark theme
      routerConfig: router,
    );
  }
}
```

---

## 3. KLASÖR YAPISI VE MİMARİ KURALLARI

Her feature şu katmanlara ayrılır:

```
features/{feature_name}/
├── data/
│   └── {feature}_repository.dart    # Sadece API çağrıları ve cache
├── domain/
│   └── {feature}_model.dart         # Sadece veri modeli + fromJson/toJson
└── presentation/
    ├── {feature}_screen.dart         # Sadece UI
    ├── {feature}_provider.dart       # Riverpod state yönetimi
    └── widgets/
        └── {widget}_widget.dart      # Yeniden kullanılabilir widget'lar
```

**Katman kuralları:**
- `data/` → Dış dünyayla iletişim (API, cache). Flutter widget'ı import edemez.
- `domain/` → Saf Dart modelleri. Flutter ve Dio import edemez.
- `presentation/` → UI ve state. `domain/` ve `data/` import edebilir.
- Widget'lar birbirini `shared/widgets/`'tan import eder. Feature'lar arası doğrudan import yapılmaz.

---

## 4. CORE — RENK VE TEMA

```dart
// lib/core/constants/app_colors.dart
import 'package:flutter/material.dart';

class AppColors {
  // Arkaplanlar
  static const Color background     = Color(0xFF0F172A);
  static const Color surface        = Color(0xFF1E293B);
  static const Color surfaceVariant = Color(0xFF334155);

  // Ana renkler
  static const Color primary        = Color(0xFF1A56DB);
  static const Color primaryLight   = Color(0xFF3B82F6);

  // Durum renkleri
  static const Color correct        = Color(0xFF10B981);
  static const Color wrong          = Color(0xFFEF4444);
  static const Color warning        = Color(0xFFF59E0B);
  static const Color blur           = Color(0xFF94A3B8);

  // Metin
  static const Color textPrimary    = Color(0xFFF8FAFC);
  static const Color textSecondary  = Color(0xFF94A3B8);
  static const Color textDisabled   = Color(0xFF475569);

  // Sıralama rozetleri
  static const Color gold           = Color(0xFFFFD700);
  static const Color silver         = Color(0xFFC0C0C0);
  static const Color bronze         = Color(0xFFCD7F32);
}
```

```dart
// lib/core/constants/app_theme.dart
import 'package:flutter/material.dart';
import 'app_colors.dart';
import 'app_text_styles.dart';

class AppTheme {
  static ThemeData dark() {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      scaffoldBackgroundColor: AppColors.background,
      colorScheme: const ColorScheme.dark(
        primary: AppColors.primary,
        surface: AppColors.surface,
        onPrimary: AppColors.textPrimary,
        onSurface: AppColors.textPrimary,
        error: AppColors.wrong,
      ),
      textTheme: AppTextStyles.textTheme,
      cardTheme: CardThemeData(
        color: AppColors.surface,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.primary,
          foregroundColor: AppColors.textPrimary,
          minimumSize: const Size(double.infinity, 52),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          textStyle: AppTextStyles.buttonText,
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppColors.surface,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide.none,
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.primary, width: 2),
        ),
        labelStyle: const TextStyle(color: AppColors.textSecondary),
        hintStyle: const TextStyle(color: AppColors.textDisabled),
      ),
    );
  }
}
```

---

## 5. CORE — DIO İSTEMCİSİ

```dart
// lib/core/network/dio_client.dart
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'auth_interceptor.dart';
import 'api_endpoints.dart';

final dioProvider = Provider<Dio>((ref) {
  final dio = Dio(
    BaseOptions(
      baseUrl: ApiEndpoints.baseUrl,
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 15),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    ),
  );

  dio.interceptors.add(AuthInterceptor(ref));
  dio.interceptors.add(LogInterceptor(
    requestBody: true,
    responseBody: true,
    error: true,
  ));

  return dio;
});
```

```dart
// lib/core/network/auth_interceptor.dart
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../storage/secure_storage.dart';
import '../errors/app_exception.dart';

class AuthInterceptor extends Interceptor {
  final Ref _ref;

  AuthInterceptor(this._ref);

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) async {
    final token = await SecureStorage.getAccessToken();
    if (token != null) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    handler.next(options);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) async {
    // 401 → token yenile ve tekrar dene
    if (err.response?.statusCode == 401) {
      try {
        final newToken = await _refreshToken();
        if (newToken != null) {
          // Orijinal isteği yeni token ile tekrarla
          err.requestOptions.headers['Authorization'] = 'Bearer $newToken';
          final retryResponse = await Dio().fetch(err.requestOptions);
          handler.resolve(retryResponse);
          return;
        }
      } catch (_) {
        // Refresh başarısız → oturumu kapat
        await _ref.read(secureStorageProvider).clearAll();
        // Auth provider'ı dinleyen GoRouter logout'a yönlendirir
      }
    }
    handler.next(err);
  }

  Future<String?> _refreshToken() async {
    final refreshToken = await SecureStorage.getRefreshToken();
    if (refreshToken == null) return null;

    final response = await Dio().post(
      '${ApiEndpoints.baseUrl}/auth/refresh',
      data: {'refreshToken': refreshToken},
    );

    final newAccessToken = response.data['data']['accessToken'] as String;
    final newRefreshToken = response.data['data']['refreshToken'] as String;

    await SecureStorage.saveTokens(
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    );

    return newAccessToken;
  }
}
```

```dart
// lib/core/network/api_endpoints.dart
class ApiEndpoints {
  static const String baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://localhost:3000/api/v1',
  );

  // Auth
  static const String googleLogin    = '/auth/google';
  static const String appleLogin     = '/auth/apple';
  static const String emailRegister  = '/auth/email/register';
  static const String emailLogin     = '/auth/email/login';
  static const String tokenRefresh   = '/auth/refresh';
  static const String logout         = '/auth/logout';

  // Users
  static const String me             = '/users/me';
  static const String myHistory      = '/users/me/history';
  static String checkNickname(String n) => '/users/check-nickname/$n';

  // Questions
  static const String dailyQuestions = '/questions/daily';
  static String startQuestion(String id) => '/questions/$id/start';

  // Sessions
  static String submitSession(String id)   => '/sessions/$id/submit';
  static String sessionResult(String id)   => '/sessions/$id/result';
  static String adReward(String id)        => '/sessions/$id/ad-reward';

  // Search
  static const String search         = '/search';

  // Leaderboard
  static const String leaderboard    = '/leaderboard';
  static const String myRanks        = '/leaderboard/me';

  // App Config
  static const String appConfig      = '/app/config';
}
```

---

## 6. CORE — GÜVENLİ DEPOLAMA

```dart
// lib/core/storage/secure_storage.dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

final secureStorageProvider = Provider<SecureStorageService>((ref) {
  return SecureStorageService();
});

class SecureStorageService {
  static const _storage = FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
    iOptions: IOSOptions(accessibility: KeychainAccessibility.first_unlock),
  );

  static const _keyAccess  = 'access_token';
  static const _keyRefresh = 'refresh_token';

  static Future<void> saveTokens({
    required String accessToken,
    required String refreshToken,
  }) async {
    await Future.wait([
      _storage.write(key: _keyAccess, value: accessToken),
      _storage.write(key: _keyRefresh, value: refreshToken),
    ]);
  }

  static Future<String?> getAccessToken() =>
      _storage.read(key: _keyAccess);

  static Future<String?> getRefreshToken() =>
      _storage.read(key: _keyRefresh);

  Future<void> clearAll() async {
    await _storage.deleteAll();
  }
}
```

---

## 7. CORE — GOROUTER NAVIGASYON

```dart
// lib/core/router/app_router.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/auth/presentation/login_screen.dart';
import '../../features/auth/presentation/nickname_screen.dart';
import '../../features/auth/presentation/avatar_country_screen.dart';
import '../../features/auth/presentation/ban_screen.dart';
import '../../features/app_config/presentation/force_update_screen.dart';
import '../../features/onboarding/presentation/splash_screen.dart';
import '../../features/onboarding/presentation/onboarding_screen.dart';
import '../../features/home/presentation/home_screen.dart';
import '../../features/game/presentation/challenge_intro_screen.dart';
import '../../features/game/presentation/game_screen.dart';
import '../../features/result/presentation/result_screen.dart';
import '../../features/leaderboard/presentation/leaderboard_screen.dart';
import '../../features/profile/presentation/profile_screen.dart';
import '../../features/profile/presentation/settings_screen.dart';
import '../../features/calendar/presentation/calendar_screen.dart';
import '../../features/stats/presentation/stats_screen.dart';
import '../../shared/providers/auth_provider.dart';
import 'route_names.dart';

final appRouterProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authStateProvider);

  return GoRouter(
    initialLocation: RouteNames.splash,
    redirect: (context, state) {
      final isAuth = authState.isAuthenticated;
      final isBanned = authState.isBanned;
      final needsOnboarding = authState.needsOnboarding;
      final needsNickname = authState.needsNickname;
      final needsAvatar = authState.needsAvatar;
      final forceUpdate = authState.forceUpdate;

      final loc = state.matchedLocation;

      // Force update — her şeyden önce
      if (forceUpdate && loc != RouteNames.forceUpdate) {
        return RouteNames.forceUpdate;
      }

      // Ban kontrolü
      if (isBanned && loc != RouteNames.banned) {
        return RouteNames.banned;
      }

      // Giriş yapılmamış
      if (!isAuth) {
        if (loc == RouteNames.login ||
            loc == RouteNames.splash ||
            loc == RouteNames.onboarding) return null;
        return RouteNames.login;
      }

      // Yeni kullanıcı akışı
      if (needsNickname && loc != RouteNames.nickname) {
        return RouteNames.nickname;
      }
      if (needsAvatar && loc != RouteNames.avatarCountry) {
        return RouteNames.avatarCountry;
      }

      // Ana ekranda olmaması gereken sayfalar
      if (isAuth && (loc == RouteNames.login || loc == RouteNames.splash)) {
        return RouteNames.home;
      }

      return null;
    },
    routes: [
      GoRoute(
        path: RouteNames.splash,
        builder: (_, __) => const SplashScreen(),
      ),
      GoRoute(
        path: RouteNames.forceUpdate,
        builder: (_, __) => const ForceUpdateScreen(),
      ),
      GoRoute(
        path: RouteNames.onboarding,
        builder: (_, __) => const OnboardingScreen(),
      ),
      GoRoute(
        path: RouteNames.login,
        builder: (_, __) => const LoginScreen(),
      ),
      GoRoute(
        path: RouteNames.nickname,
        builder: (_, __) => const NicknameScreen(),
      ),
      GoRoute(
        path: RouteNames.avatarCountry,
        builder: (_, __) => const AvatarCountryScreen(),
      ),
      GoRoute(
        path: RouteNames.banned,
        builder: (_, __) => const BanScreen(),
      ),

      // Ana shell — alt navigasyon barı
      ShellRoute(
        builder: (context, state, child) => MainShell(child: child),
        routes: [
          GoRoute(
            path: RouteNames.home,
            builder: (_, __) => const HomeScreen(),
          ),
          GoRoute(
            path: RouteNames.leaderboard,
            builder: (_, __) => const LeaderboardScreen(),
          ),
          GoRoute(
            path: RouteNames.calendar,
            builder: (_, __) => const CalendarScreen(),
          ),
          GoRoute(
            path: RouteNames.stats,
            builder: (_, __) => const StatsScreen(),
          ),
          GoRoute(
            path: RouteNames.profile,
            builder: (_, __) => const ProfileScreen(),
          ),
        ],
      ),

      // Alt navigasyon dışı route'lar
      GoRoute(
        path: RouteNames.challengeIntro,
        builder: (_, state) => ChallengeIntroScreen(
          questionId: state.pathParameters['questionId']!,
          module: state.uri.queryParameters['module']!,
        ),
      ),
      GoRoute(
        path: RouteNames.game,
        builder: (_, state) => GameScreen(
          sessionId: state.pathParameters['sessionId']!,
        ),
      ),
      GoRoute(
        path: RouteNames.result,
        builder: (_, state) => ResultScreen(
          sessionId: state.pathParameters['sessionId']!,
        ),
      ),
      GoRoute(
        path: RouteNames.settings,
        builder: (_, __) => const SettingsScreen(),
      ),
    ],
    errorBuilder: (context, state) => Scaffold(
      body: Center(
        child: Text('Sayfa bulunamadı: ${state.error}'),
      ),
    ),
  );
});
```

```dart
// lib/core/router/route_names.dart
class RouteNames {
  static const String splash         = '/';
  static const String forceUpdate    = '/force-update';
  static const String onboarding     = '/onboarding';
  static const String login          = '/login';
  static const String nickname       = '/nickname';
  static const String avatarCountry  = '/avatar-country';
  static const String banned         = '/banned';
  static const String home           = '/home';
  static const String leaderboard    = '/leaderboard';
  static const String calendar       = '/calendar';
  static const String stats          = '/stats';
  static const String profile        = '/profile';
  static const String settings       = '/settings';
  static const String challengeIntro = '/challenge/:questionId';
  static const String game           = '/game/:sessionId';
  static const String result         = '/result/:sessionId';
}
```

---

## 8. RIVERPOD STATE YÖNETİMİ KALIPLARI

### Auth Provider (Merkezi Oturum Durumu)

```dart
// lib/shared/providers/auth_provider.dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/storage/secure_storage.dart';
import '../../features/auth/data/auth_repository.dart';

class AuthState {
  final bool isAuthenticated;
  final bool isBanned;
  final bool needsNickname;
  final bool needsAvatar;
  final bool forceUpdate;
  final String? userId;

  const AuthState({
    this.isAuthenticated = false,
    this.isBanned = false,
    this.needsNickname = false,
    this.needsAvatar = false,
    this.forceUpdate = false,
    this.userId,
  });

  AuthState copyWith({
    bool? isAuthenticated,
    bool? isBanned,
    bool? needsNickname,
    bool? needsAvatar,
    bool? forceUpdate,
    String? userId,
  }) {
    return AuthState(
      isAuthenticated: isAuthenticated ?? this.isAuthenticated,
      isBanned: isBanned ?? this.isBanned,
      needsNickname: needsNickname ?? this.needsNickname,
      needsAvatar: needsAvatar ?? this.needsAvatar,
      forceUpdate: forceUpdate ?? this.forceUpdate,
      userId: userId ?? this.userId,
    );
  }
}

class AuthNotifier extends AsyncNotifier<AuthState> {
  @override
  Future<AuthState> build() async {
    // Uygulama açılışında token kontrol et
    final token = await SecureStorage.getAccessToken();
    if (token == null) return const AuthState();

    // Token varsa kullanıcı bilgisini doğrula
    try {
      final user = await ref.read(authRepositoryProvider).getMe();
      return AuthState(
        isAuthenticated: true,
        isBanned: user.isBanned,
        needsNickname: user.nickname.isEmpty,
        needsAvatar: user.avatarIndex == null,
        userId: user.id,
      );
    } catch (_) {
      await SecureStorage.clearAll();  // Geçersiz token temizle
      return const AuthState();
    }
  }

  Future<void> loginWithGoogle() async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() async {
      final result = await ref.read(authRepositoryProvider).loginWithGoogle();
      await SecureStorage.saveTokens(
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      );
      return AuthState(
        isAuthenticated: true,
        needsNickname: result.isNewUser,
        needsAvatar: result.isNewUser,
        userId: result.userId,
      );
    });
  }

  Future<void> logout() async {
    await ref.read(authRepositoryProvider).logout();
    await ref.read(secureStorageProvider).clearAll();
    state = const AsyncValue.data(AuthState());
  }
}

final authStateProvider = AsyncNotifierProvider<AuthNotifier, AuthState>(
  AuthNotifier.new,
);
```

### Basit AsyncNotifier Kalıbı (Feature Provider'ı)

```dart
// lib/features/home/presentation/home_provider.dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/home_repository.dart';
import '../domain/daily_question_model.dart';

// Repository provider
final homeRepositoryProvider = Provider<HomeRepository>((ref) {
  return HomeRepository(ref.watch(dioProvider));
});

// State provider
final dailyQuestionsProvider = FutureProvider<List<DailyQuestion>>((ref) async {
  return ref.watch(homeRepositoryProvider).getDailyQuestions();
});
```

### Arama (Debounce) Provider Kalıbı

```dart
// lib/features/game/presentation/widgets/autocomplete_provider.dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/search_repository.dart';
import '../../domain/search_result_model.dart';

// Arama terimi için StateProvider
final searchQueryProvider = StateProvider<String>((ref) => '');

// Debounced arama sonuçları
final searchResultsProvider = FutureProvider.family<List<SearchResult>, String>(
  (ref, query) async {
    if (query.length < 2) return [];
    return ref.watch(searchRepositoryProvider).search(query: query);
  },
);
```

---

## 9. SHARED WIDGETS — ANA BUTON

```dart
// lib/shared/widgets/primary_button_widget.dart
import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_text_styles.dart';

class PrimaryButton extends StatelessWidget {
  final String label;
  final VoidCallback? onPressed;
  final bool isLoading;
  final IconData? icon;
  final Color? backgroundColor;

  const PrimaryButton({
    super.key,
    required this.label,
    this.onPressed,
    this.isLoading = false,
    this.icon,
    this.backgroundColor,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      height: 52,
      child: ElevatedButton(
        onPressed: isLoading ? null : onPressed,
        style: ElevatedButton.styleFrom(
          backgroundColor: backgroundColor ?? AppColors.primary,
          disabledBackgroundColor: AppColors.surfaceVariant,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
        child: isLoading
            ? const SizedBox(
                width: 22,
                height: 22,
                child: CircularProgressIndicator(
                  strokeWidth: 2.5,
                  valueColor: AlwaysStoppedAnimation(AppColors.textPrimary),
                ),
              )
            : Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  if (icon != null) ...[
                    Icon(icon, size: 20, color: AppColors.textPrimary),
                    const SizedBox(width: 8),
                  ],
                  Text(label, style: AppTextStyles.buttonText),
                ],
              ),
      ),
    );
  }
}
```

---

## 10. SHARED WIDGETS — HATA EKRANI

```dart
// lib/shared/widgets/error_screen_widget.dart
import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_text_styles.dart';
import 'primary_button_widget.dart';

class ErrorScreenWidget extends StatelessWidget {
  final String? message;
  final VoidCallback? onRetry;

  const ErrorScreenWidget({
    super.key,
    this.message,
    this.onRetry,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Text('😕', style: TextStyle(fontSize: 64)),
            const SizedBox(height: 24),
            Text(
              message ?? 'Bir şeyler ters gitti',
              style: AppTextStyles.titleMedium,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 32),
            if (onRetry != null)
              PrimaryButton(
                label: 'Tekrar Dene',
                onPressed: onRetry,
              ),
          ],
        ),
      ),
    );
  }
}
```

---

## 11. SCREEN YAPISI — STANDART KALIP

Her ekran şu yapıyı takip eder:

```dart
// lib/features/home/presentation/home_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/constants/app_colors.dart';
import '../../../shared/widgets/error_screen_widget.dart';
import '../../../shared/widgets/loading_widget.dart';
import 'home_provider.dart';
import 'widgets/module_card_widget.dart';
import 'widgets/special_event_banner_widget.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final questionsAsync = ref.watch(dailyQuestionsProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: questionsAsync.when(
          loading: () => const LoadingWidget(),
          error: (err, _) => ErrorScreenWidget(
            message: _errorMessage(err),
            onRetry: () => ref.invalidate(dailyQuestionsProvider),
          ),
          data: (questions) => _buildContent(context, ref, questions),
        ),
      ),
    );
  }

  Widget _buildContent(BuildContext context, WidgetRef ref, List<dynamic> questions) {
    return RefreshIndicator(
      onRefresh: () async => ref.invalidate(dailyQuestionsProvider),
      child: CustomScrollView(
        slivers: [
          // App bar
          const SliverAppBar(/* ... */),
          // Özel etkinlik banner
          const SliverToBoxAdapter(child: SpecialEventBannerWidget()),
          // Modül kartları
          SliverPadding(
            padding: const EdgeInsets.all(16),
            sliver: SliverGrid(/* ... */),
          ),
        ],
      ),
    );
  }

  String _errorMessage(Object err) {
    if (err is AppException) return err.message;
    return 'Bir şeyler ters gitti';
  }
}
```

---

## 12. REPOSITORY KALIPLARI — DATA KATMANI

```dart
// lib/features/home/data/home_repository.dart
import 'package:dio/dio.dart';
import '../../../core/network/api_endpoints.dart';
import '../../../core/errors/app_exception.dart';
import '../domain/daily_question_model.dart';

class HomeRepository {
  final Dio _dio;

  HomeRepository(this._dio);

  Future<List<DailyQuestion>> getDailyQuestions() async {
    try {
      final response = await _dio.get(ApiEndpoints.dailyQuestions);
      final List<dynamic> data = response.data['data'];
      return data.map((e) => DailyQuestion.fromJson(e)).toList();
    } on DioException catch (e) {
      throw AppException.fromDioError(e);
    }
  }
}
```

---

## 13. DOMAIN MODEL KALIPLARI

```dart
// lib/features/home/domain/daily_question_model.dart

class DailyQuestion {
  final String id;
  final String module;       // 'players' | 'clubs' | 'nationals' | 'managers'
  final String difficulty;   // 'easy' | 'medium' | 'hard'
  final int answerCount;
  final int timeLimitSeconds;
  final bool isCompleted;
  final bool isSpecialEvent;
  final int? myScore;        // Tamamlandıysa kazanılan puan

  const DailyQuestion({
    required this.id,
    required this.module,
    required this.difficulty,
    required this.answerCount,
    required this.timeLimitSeconds,
    required this.isCompleted,
    required this.isSpecialEvent,
    this.myScore,
  });

  factory DailyQuestion.fromJson(Map<String, dynamic> json) {
    return DailyQuestion(
      id: json['id'] as String,
      module: json['module'] as String,
      difficulty: json['difficulty'] as String,
      answerCount: json['answerCount'] as int,
      timeLimitSeconds: json['timeLimitSeconds'] as int,
      isCompleted: json['isCompleted'] as bool,
      isSpecialEvent: json['isSpecialEvent'] as bool,
      myScore: json['myScore'] as int?,
    );
  }
}
```

---

## 14. HATA SINIFI

```dart
// lib/core/errors/app_exception.dart
import 'package:dio/dio.dart';

class AppException implements Exception {
  final String code;
  final String message;
  final int? statusCode;

  const AppException({
    required this.code,
    required this.message,
    this.statusCode,
  });

  factory AppException.fromDioError(DioException e) {
    final data = e.response?.data;
    final errorObj = data is Map ? data['error'] : null;

    return AppException(
      code: errorObj?['code'] as String? ?? 'UNKNOWN',
      message: errorObj?['message'] as String? ?? 'Beklenmedik bir hata oluştu',
      statusCode: e.response?.statusCode,
    );
  }

  // Sık kullanılan kontrol
  bool get isUnauthorized => statusCode == 401;
  bool get isBanned => code == 'ACCOUNT_BANNED';
  bool get isSessionExists => code == 'SESSION_ALREADY_EXISTS';

  @override
  String toString() => 'AppException($code): $message';
}
```

---

## 15. KESİNLİKLE YAPILMAYACAKLAR

- `setState` kullanılmaz. Her state yönetimi Riverpod ile yapılır.
- `BuildContext` repository veya provider'a geçirilmez.
- Feature'lar birbirinin `presentation/` katmanını doğrudan import edemez. `shared/` kullanılır.
- `Navigator.push()` kullanılmaz. Her navigasyon `context.go()` veya `context.push()` ile GoRouter üzerinden yapılır.
- `dio.get()` çağrıları doğrudan widget'ta yapılmaz. Her zaman repository katmanından geçer.
- `async/await` kullanan kod `try/catch` veya `AsyncValue.guard` olmadan yazılmaz.
- `print()` kullanılmaz. Debug için `debugPrint()` kullanılır, production'da kaldırılır.
- Renkler ve text style'lar widget içinde `Color(0xFF...)` şeklinde hardcode edilmez. Her zaman `AppColors` ve `AppTextStyles` kullanılır.
- Model sınıflarında `flutter` paketi import edilmez. Saf Dart olmalıdır.
