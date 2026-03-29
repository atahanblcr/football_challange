import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/auth/presentation/login_screen.dart';
import '../../features/auth/presentation/register_screen.dart';
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
import '../../shared/providers/auth_provider.dart';
import '../../shared/widgets/bottom_nav_widget.dart';
import 'route_names.dart';

final appRouterProvider = Provider<GoRouter>((ref) {
  final authStateAsync = ref.watch(authStateProvider);

  return GoRouter(
    initialLocation: RouteNames.splash,
    redirect: (context, state) {
      if (authStateAsync.isLoading) return null;
      
      final authState = authStateAsync.value;
      final isAuth = authState?.isAuthenticated ?? false;
      final needsNickname = authState?.needsNickname ?? false;
      final needsAvatar = authState?.needsAvatar ?? false;
      
      final loc = state.matchedLocation;

      if (!isAuth) {
        if (loc == RouteNames.splash || loc == RouteNames.onboarding || loc == RouteNames.login || loc == RouteNames.register) return null;
        return RouteNames.login;
      }

      if (needsNickname && loc != RouteNames.nickname && loc != RouteNames.avatarCountry) return RouteNames.nickname;
      if (needsAvatar && loc != RouteNames.avatarCountry && loc != RouteNames.nickname) return RouteNames.avatarCountry;

      if (isAuth && (loc == RouteNames.login || loc == RouteNames.splash)) return RouteNames.home;

      return null;
    },
    routes: [
      GoRoute(path: RouteNames.splash, builder: (_, __) => const SplashScreen()),
      GoRoute(path: RouteNames.onboarding, builder: (_, __) => const OnboardingScreen()),
      GoRoute(
        name: 'login',
        path: RouteNames.login, 
        builder: (_, __) => const LoginScreen(),
      ),
      GoRoute(
        name: 'register',
        path: RouteNames.register, 
        builder: (_, __) => const RegisterScreen(),
      ),
      GoRoute(
        name: 'nickname',
        path: RouteNames.nickname, 
        builder: (_, __) => const NicknameScreen(),
      ),
      GoRoute(
        name: 'avatarCountry',
        path: RouteNames.avatarCountry, 
        builder: (_, __) => const AvatarCountryScreen(),
      ),
      GoRoute(path: RouteNames.forceUpdate, builder: (_, __) => const ForceUpdateScreen()),
      GoRoute(path: RouteNames.banned, builder: (_, __) => const BanScreen()),

      ShellRoute(
        builder: (context, state, child) => MainShell(child: child),
        routes: [
          GoRoute(path: RouteNames.home, builder: (_, __) => const HomeScreen()),
          GoRoute(path: RouteNames.leaderboard, builder: (_, __) => const LeaderboardScreen()),
          GoRoute(path: RouteNames.calendar, builder: (_, __) => const CalendarScreen()),
          GoRoute(path: RouteNames.profile, builder: (_, __) => const ProfileScreen()),
        ],
      ),

      GoRoute(
        name: RouteNames.challengeIntro,
        path: '/challenge/:questionId',
        builder: (_, state) {
          final qid = state.pathParameters['questionId']!;
          final qp = state.uri.queryParameters;
          return ChallengeIntroScreen(
            questionId: qid,
            module: qp['module']!,
            difficulty: qp['difficulty']!,
            answerCount: int.parse(qp['answerCount']!),
            timeLimit: int.parse(qp['timeLimit']!),
          );
        },
      ),
      GoRoute(
        name: RouteNames.game,
        path: '/game/:sessionId',
        builder: (_, state) => GameScreen(sessionId: state.pathParameters['sessionId']!),
      ),
      GoRoute(
        name: RouteNames.result,
        path: '/result/:sessionId',
        builder: (_, state) => ResultScreen(sessionId: state.pathParameters['sessionId']!),
      ),
      GoRoute(
        name: RouteNames.settings,
        path: RouteNames.settings,
        builder: (_, __) => const SettingsScreen(),
      ),
    ],
  );
});
