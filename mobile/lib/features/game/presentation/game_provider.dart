import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hive_flutter/hive_flutter.dart';
import '../../../core/storage/hive_storage.dart';
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

class GameNotifier extends FamilyNotifier<GameState, String> {
  late final Box _box;

  @override
  GameState build(String arg) {
    _box = Hive.box(HiveStorage.draftsBox);
    final saved = _box.get(arg) as List?;
    if (saved != null) {
      final answers = saved
          .map((e) => SearchResult.fromJson(Map<String, dynamic>.from(e)))
          .toList();
      return GameState(selectedAnswers: answers);
    }
    return const GameState();
  }

  void _saveDraft() {
    final data = state.selectedAnswers.map((a) => a.toJson()).toList();
    _box.put(arg, data);
  }

  void _clearDraft() {
    _box.delete(arg);
  }

  void addAnswer(SearchResult result) {
    final current = state.selectedAnswers;
    if (current.any((a) => a.entityId == result.entityId)) return;
    state = state.copyWith(
      selectedAnswers: [...current, result],
    );
    _saveDraft();
  }

  void removeAnswer(String entityId) {
    state = state.copyWith(
      selectedAnswers: state.selectedAnswers
          .where((a) => a.entityId != entityId)
          .toList(),
    );
    _saveDraft();
  }

  Future<void> submit(String sessionId) async {
    state = state.copyWith(isSubmitting: true);
    try {
      await ref.read(gameRepositoryProvider).submitSession(
        sessionId: sessionId,
        entityIds: state.selectedAnswers.map((a) => a.entityId).toList(),
      );
      _clearDraft();
    } catch (e) {
      state = state.copyWith(isSubmitting: false, error: e.toString());
      rethrow;
    }
  }
}

final gameNotifierProvider = NotifierProvider.family<GameNotifier, GameState, String>(
  GameNotifier.new,
);

final searchQueryProvider = StateProvider<String>((ref) => '');

final searchResultsProvider = FutureProvider.family<List<SearchResult>, ({String query, String entityType, String sessionId})>(
  (ref, params) async {
    if (params.query.length < 2) return [];
    final selected = ref.watch(gameNotifierProvider(params.sessionId)).selectedAnswers;
    final selectedIds = selected.map((a) => a.entityId).toSet();
    final results = await ref.watch(searchRepositoryProvider)
        .search(query: params.query, entityType: params.entityType);
    return results.where((r) => !selectedIds.contains(r.entityId)).toList();
  },
);
