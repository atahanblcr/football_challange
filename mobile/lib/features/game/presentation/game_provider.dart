import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/game_repository.dart';
import '../data/search_repository.dart';
import '../domain/search_result_model.dart';

class GameState {
  final List<SearchResult> selectedAnswers;
  final bool isSubmitting;
  final String? error;

  const GameState({
    this.selectedAnswers = const [],
    this.isSubmitting = false,
    this.error,
  });

  GameState copyWith({
    List<SearchResult>? selectedAnswers,
    bool? isSubmitting,
    String? error,
  }) {
    return GameState(
      selectedAnswers: selectedAnswers ?? this.selectedAnswers,
      isSubmitting: isSubmitting ?? this.isSubmitting,
      error: error,
    );
  }
}

class GameNotifier extends Notifier<GameState> {
  @override
  GameState build() => const GameState();

  void addAnswer(SearchResult result) {
    final current = state.selectedAnswers;
    if (current.any((a) => a.entityId == result.entityId)) return;
    state = state.copyWith(
      selectedAnswers: [...current, result],
    );
  }

  void removeAnswer(String entityId) {
    state = state.copyWith(
      selectedAnswers: state.selectedAnswers
          .where((a) => a.entityId != entityId)
          .toList(),
    );
  }

  Future<void> submit(String sessionId) async {
    state = state.copyWith(isSubmitting: true);
    try {
      await ref.read(gameRepositoryProvider).submitSession(
        sessionId: sessionId,
        entityIds: state.selectedAnswers.map((a) => a.entityId).toList(),
      );
    } catch (e) {
      state = state.copyWith(isSubmitting: false, error: e.toString());
      rethrow;
    }
  }
}

final gameNotifierProvider = NotifierProvider<GameNotifier, GameState>(
  GameNotifier.new,
);

final searchQueryProvider = StateProvider<String>((ref) => '');

final searchResultsProvider = FutureProvider.family<List<SearchResult>, ({String query, String entityType})>(
  (ref, params) async {
    if (params.query.length < 2) return [];
    final selected = ref.watch(gameNotifierProvider).selectedAnswers;
    final selectedIds = selected.map((a) => a.entityId).toSet();
    final results = await ref.watch(searchRepositoryProvider)
        .search(query: params.query, entityType: params.entityType);
    return results.where((r) => !selectedIds.contains(r.entityId)).toList();
  },
);
