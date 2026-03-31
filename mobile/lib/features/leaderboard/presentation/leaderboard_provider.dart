import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/leaderboard_repository.dart';
import '../domain/leaderboard_model.dart';

final leaderboardScopeProvider = StateProvider<String>((ref) => 'global');
final leaderboardPeriodProvider = StateProvider<String>((ref) => 'alltime');
final leaderboardModuleProvider = StateProvider<String?>((ref) => null);

final leaderboardProvider = FutureProvider<LeaderboardResponse>((ref) async {
  final scope = ref.watch(leaderboardScopeProvider);
  final period = ref.watch(leaderboardPeriodProvider);
  final module = ref.watch(leaderboardModuleProvider);
  
  return ref.watch(leaderboardRepositoryProvider).getLeaderboard(
    scope: scope, 
    period: period,
    module: module,
  );
});
