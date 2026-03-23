---
name: flutter-game-screen
description: Specialized procedural guidance for flutter-game-screen in the Football Challenge project.
---

# SKILL: FLUTTER GAME SCREEN — TIMER, AUTOCOMPLETE, SLOT, BLUR, SONUÇ EKRANI

> Bu skill dosyası Football Challenge'ın en kritik ekranlarını tanımlar:
> Challenge tanıtım (E-07), Oyun (E-08) ve Sonuç (E-09) ekranları.
> Timer mantığı, autocomplete davranışı, slot yönetimi ve blur efekti
> burada tanımlanan kurallara göre implemento edilir.

---

## 1. TİP TANIMLARI — GAME DOMAIN MODELLERİ

```dart
// lib/features/game/domain/game_session_model.dart

class GameSession {
  final String sessionId;
  final String questionId;
  final String questionTitle;
  final String module;
  final String difficulty;
  final int answerCount;
  final int timeLimitSeconds;
  final DateTime startedAt;

  const GameSession({
    required this.sessionId,
    required this.questionId,
    required this.questionTitle,
    required this.module,
    required this.difficulty,
    required this.answerCount,
    required this.timeLimitSeconds,
    required this.startedAt,
  });

  factory GameSession.fromJson(Map<String, dynamic> json) {
    return GameSession(
      sessionId: json['sessionId'] as String,
      questionId: json['questionId'] as String,
      questionTitle: json['questionTitle'] as String,
      module: json['module'] as String,
      difficulty: json['difficulty'] as String,
      answerCount: json['answerCount'] as int,
      timeLimitSeconds: json['timeLimitSeconds'] as int,
      startedAt: DateTime.parse(json['startedAt'] as String),
    );
  }
}
```

```dart
// lib/features/game/domain/search_result_model.dart

class SearchResult {
  final String entityId;
  final String name;
  final String? countryCode;
  final String? clubName;
  final String entityType; // 'player' | 'club' | 'national' | 'manager'

  const SearchResult({
    required this.entityId,
    required this.name,
    this.countryCode,
    this.clubName,
    required this.entityType,
  });

  factory SearchResult.fromJson(Map<String, dynamic> json) {
    return SearchResult(
      entityId: json['entityId'] as String,
      name: json['name'] as String,
      countryCode: json['countryCode'] as String?,
      clubName: json['clubName'] as String?,
      entityType: json['entityType'] as String,
    );
  }
}
```

```dart
// lib/features/result/domain/result_model.dart

enum AnswerRowStatus { correct, blurred, wrong }

class AnswerRow {
  final int rank;
  final AnswerRowStatus status;
  final String? entityName;    // null ise blur
  final String? statDisplay;   // null ise blur ("192 asist")
  final String? countryCode;

  const AnswerRow({
    required this.rank,
    required this.status,
    this.entityName,
    this.statDisplay,
    this.countryCode,
  });

  factory AnswerRow.fromJson(Map<String, dynamic> json) {
    final statusStr = json['status'] as String;
    return AnswerRow(
      rank: json['rank'] as int,
      status: AnswerRowStatus.values.byName(statusStr),
      entityName: json['entityName'] as String?,
      statDisplay: json['statDisplay'] as String?,
      countryCode: json['countryCode'] as String?,
    );
  }
}

class SessionResult {
  final String sessionId;
  final int correctCount;
  final int totalCount;
  final int scoreBase;
  final int scoreTimeBonus;
  final int scoreDifficulty;
  final int scoreFinal;
  final bool adMultiplied;
  final List<AnswerRow> answers;
  final List<String> wrongEntityNames;
  final int? rankChangeTr;      // null = yükleniyor
  final int? rankChangeGlobal;
  final int? newRankTr;
  final int? newRankGlobal;

  const SessionResult({
    required this.sessionId,
    required this.correctCount,
    required this.totalCount,
    required this.scoreBase,
    required this.scoreTimeBonus,
    required this.scoreDifficulty,
    required this.scoreFinal,
    required this.adMultiplied,
    required this.answers,
    required this.wrongEntityNames,
    this.rankChangeTr,
    this.rankChangeGlobal,
    this.newRankTr,
    this.newRankGlobal,
  });

  factory SessionResult.fromJson(Map<String, dynamic> json) {
    return SessionResult(
      sessionId: json['sessionId'] as String,
      correctCount: json['correctCount'] as int,
      totalCount: json['totalCount'] as int,
      scoreBase: json['scoreBase'] as int,
      scoreTimeBonus: json['scoreTimeBonus'] as int,
      scoreDifficulty: json['scoreDifficulty'] as int,
      scoreFinal: json['scoreFinal'] as int,
      adMultiplied: json['adMultiplied'] as bool,
      answers: (json['answers'] as List)
          .map((e) => AnswerRow.fromJson(e))
          .toList(),
      wrongEntityNames: (json['wrongEntityNames'] as List)
          .map((e) => e as String)
          .toList(),
      rankChangeTr: json['rankChangeTr'] as int?,
      rankChangeGlobal: json['rankChangeGlobal'] as int?,
      newRankTr: json['newRankTr'] as int?,
      newRankGlobal: json['newRankGlobal'] as int?,
    );
  }

  SessionResult copyWith({
    int? scoreFinal,
    bool? adMultiplied,
    int? rankChangeTr,
    int? rankChangeGlobal,
    int? newRankTr,
    int? newRankGlobal,
  }) {
    return SessionResult(
      sessionId: sessionId,
      correctCount: correctCount,
      totalCount: totalCount,
      scoreBase: scoreBase,
      scoreTimeBonus: scoreTimeBonus,
      scoreDifficulty: scoreDifficulty,
      scoreFinal: scoreFinal ?? this.scoreFinal,
      adMultiplied: adMultiplied ?? this.adMultiplied,
      answers: answers,
      wrongEntityNames: wrongEntityNames,
      rankChangeTr: rankChangeTr ?? this.rankChangeTr,
      rankChangeGlobal: rankChangeGlobal ?? this.rankChangeGlobal,
      newRankTr: newRankTr ?? this.newRankTr,
      newRankGlobal: newRankGlobal ?? this.newRankGlobal,
    );
  }
}
```

---

## 2. GAME REPOSITORY

```dart
// lib/features/game/data/game_repository.dart
import 'package:dio/dio.dart';
import '../../../core/network/api_endpoints.dart';
import '../../../core/errors/app_exception.dart';
import '../domain/game_session_model.dart';

class GameRepository {
  final Dio _dio;
  GameRepository(this._dio);

  /// Soruyu başlatır — sunucu started_at kaydeder
  Future<GameSession> startQuestion(String questionId) async {
    try {
      final response = await _dio.post(ApiEndpoints.startQuestion(questionId));
      return GameSession.fromJson(response.data['data']);
    } on DioException catch (e) {
      throw AppException.fromDioError(e);
    }
  }

  /// Cevapları gönderir
  Future<void> submitSession({
    required String sessionId,
    required List<String> entityIds,
  }) async {
    try {
      await _dio.post(
        ApiEndpoints.submitSession(sessionId),
        data: {'entityIds': entityIds},
      );
    } on DioException catch (e) {
      throw AppException.fromDioError(e);
    }
  }
}
```

```dart
// lib/features/game/data/search_repository.dart
import 'package:dio/dio.dart';
import '../../../core/network/api_endpoints.dart';
import '../../../core/errors/app_exception.dart';
import '../domain/search_result_model.dart';

class SearchRepository {
  final Dio _dio;
  SearchRepository(this._dio);

  Future<List<SearchResult>> search({
    required String query,
    required String entityType, // 'player' | 'club' | 'national' | 'manager'
  }) async {
    try {
      final response = await _dio.get(
        ApiEndpoints.search,
        queryParameters: {'q': query, 'type': entityType},
      );
      final List data = response.data['data'];
      return data.map((e) => SearchResult.fromJson(e)).toList();
    } on DioException catch (e) {
      throw AppException.fromDioError(e);
    }
  }
}
```

---

## 3. GAME STATE — RIVERPOD NOTIFIER

```dart
// lib/features/game/presentation/game_provider.dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/game_repository.dart';
import '../data/search_repository.dart';
import '../domain/search_result_model.dart';

// ─── Seçilen cevaplar ───────────────────────────────────────────────

class GameState {
  final List<SearchResult> selectedAnswers; // Seçilen entityler
  final bool isSubmitting;
  final String? error;

  const GameState({
    this.selectedAnswers = const [],
    this.isSubmitting = false,
    this.error,
  });

  bool get allSlotsFilled => false; // Dışarıdan totalAnswers ile karşılaştırılır

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
    if (current.any((a) => a.entityId == result.entityId)) return; // Çift ekleme önleme
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

// ─── Autocomplete arama ─────────────────────────────────────────────

final searchQueryProvider = StateProvider<String>((ref) => '');

final searchResultsProvider = FutureProvider.family<List<SearchResult>, ({String query, String entityType})>(
  (ref, params) async {
    if (params.query.length < 2) return [];
    // Seçilenleri çıkar
    final selected = ref.watch(gameNotifierProvider).selectedAnswers;
    final selectedIds = selected.map((a) => a.entityId).toSet();
    final results = await ref.watch(searchRepositoryProvider)
        .search(query: params.query, entityType: params.entityType);
    return results.where((r) => !selectedIds.contains(r.entityId)).toList();
  },
);

final gameRepositoryProvider = Provider<GameRepository>((ref) {
  return GameRepository(ref.watch(dioProvider));
});

final searchRepositoryProvider = Provider<SearchRepository>((ref) {
  return SearchRepository(ref.watch(dioProvider));
});
```

---

## 4. TIMER WIDGET — RENK GEÇİŞLİ + TİTREŞİMLİ

```dart
// lib/features/game/presentation/widgets/timer_widget.dart
import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/constants/app_text_styles.dart';

class TimerWidget extends StatefulWidget {
  final DateTime startedAt;
  final int timeLimitSeconds;
  final VoidCallback onExpired; // Süre dolunca çağrılır

  const TimerWidget({
    super.key,
    required this.startedAt,
    required this.timeLimitSeconds,
    required this.onExpired,
  });

  @override
  State<TimerWidget> createState() => _TimerWidgetState();
}

class _TimerWidgetState extends State<TimerWidget>
    with SingleTickerProviderStateMixin {
  late Timer _ticker;
  late AnimationController _pulseController;
  int _remainingSeconds = 0;
  bool _expired = false;

  @override
  void initState() {
    super.initState();

    // Pulse animasyonu (kritik sürede)
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 500),
    )..repeat(reverse: true);

    // Sunucudan gelen startedAt'a göre kalan süreyi hesapla
    // (Uygulama arka plana gidip gelirse doğru süreyi gösterir)
    _updateRemaining();

    _ticker = Timer.periodic(const Duration(seconds: 1), (_) {
      _updateRemaining();
    });
  }

  void _updateRemaining() {
    if (_expired) return;

    final elapsed = DateTime.now().difference(widget.startedAt).inSeconds;
    final remaining = widget.timeLimitSeconds - elapsed;

    if (remaining <= 0) {
      if (!_expired) {
        _expired = true;
        _ticker.cancel();
        // Titreşim: uzun + kısa + kısa
        HapticFeedback.vibrate();
        Future.delayed(const Duration(milliseconds: 200), () {
          HapticFeedback.lightImpact();
          Future.delayed(const Duration(milliseconds: 200), () {
            HapticFeedback.lightImpact();
          });
        });
        widget.onExpired();
      }
      setState(() => _remainingSeconds = 0);
      return;
    }

    // Kritik eşikte titreşim
    if (remaining == 10) {
      HapticFeedback.mediumImpact();
    } else if (remaining <= 3) {
      HapticFeedback.heavyImpact();
    }

    setState(() => _remainingSeconds = remaining);
  }

  @override
  void dispose() {
    _ticker.cancel();
    _pulseController.dispose();
    super.dispose();
  }

  Color get _timerColor {
    if (_remainingSeconds <= 3) return AppColors.wrong;
    if (_remainingSeconds <= 10) return AppColors.warning;
    return AppColors.primary;
  }

  double get _progressRatio {
    return _remainingSeconds / widget.timeLimitSeconds;
  }

  @override
  Widget build(BuildContext context) {
    final isCritical = _remainingSeconds <= 3 && !_expired;

    return Column(
      children: [
        // Sayaç metni
        AnimatedBuilder(
          animation: _pulseController,
          builder: (context, child) {
            return Opacity(
              opacity: isCritical
                  ? 0.5 + (_pulseController.value * 0.5)
                  : 1.0,
              child: Text(
                _formatTime(_remainingSeconds),
                style: AppTextStyles.timerText.copyWith(color: _timerColor),
              ),
            );
          },
        ),
        const SizedBox(height: 8),
        // Progress bar
        AnimatedContainer(
          duration: const Duration(milliseconds: 500),
          height: 4,
          child: LinearProgressIndicator(
            value: _progressRatio,
            backgroundColor: AppColors.surfaceVariant,
            valueColor: AlwaysStoppedAnimation(_timerColor),
          ),
        ),
      ],
    );
  }

  String _formatTime(int seconds) {
    if (seconds <= 0) return '0:00';
    final m = seconds ~/ 60;
    final s = seconds % 60;
    return '$m:${s.toString().padLeft(2, '0')}';
  }
}
```

---

## 5. AUTOCOMPLETE WIDGET

```dart
// lib/features/game/presentation/widgets/autocomplete_widget.dart
import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/constants/app_text_styles.dart';
import '../../domain/search_result_model.dart';
import '../game_provider.dart';

class AutocompleteWidget extends ConsumerStatefulWidget {
  final String entityType;
  final int maxResults;

  const AutocompleteWidget({
    super.key,
    required this.entityType,
    this.maxResults = 6,
  });

  @override
  ConsumerState<AutocompleteWidget> createState() => _AutocompleteWidgetState();
}

class _AutocompleteWidgetState extends ConsumerState<AutocompleteWidget> {
  final _controller = TextEditingController();
  final _focusNode = FocusNode();
  Timer? _debounce;
  String _query = '';

  @override
  void dispose() {
    _controller.dispose();
    _focusNode.dispose();
    _debounce?.cancel();
    super.dispose();
  }

  void _onChanged(String value) {
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 300), () {
      if (mounted) setState(() => _query = value.trim());
    });
  }

  void _onSelect(SearchResult result) {
    ref.read(gameNotifierProvider.notifier).addAnswer(result);
    _controller.clear();
    setState(() => _query = '');
    _focusNode.unfocus();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // Arama kutusu
        TextField(
          controller: _controller,
          focusNode: _focusNode,
          onChanged: _onChanged,
          style: const TextStyle(color: AppColors.textPrimary),
          decoration: InputDecoration(
            hintText: _hintText,
            prefixIcon: const Icon(Icons.search, color: AppColors.textSecondary),
            suffixIcon: _query.isNotEmpty
                ? IconButton(
                    icon: const Icon(Icons.clear, color: AppColors.textSecondary),
                    onPressed: () {
                      _controller.clear();
                      setState(() => _query = '');
                    },
                  )
                : null,
          ),
        ),

        // Sonuç dropdown
        if (_query.length >= 2)
          _buildDropdown(),
      ],
    );
  }

  Widget _buildDropdown() {
    final params = (query: _query, entityType: widget.entityType);
    final resultsAsync = ref.watch(searchResultsProvider(params));

    return AnimatedSize(
      duration: const Duration(milliseconds: 150),
      child: Container(
        margin: const EdgeInsets.only(top: 4),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.surfaceVariant),
        ),
        child: resultsAsync.when(
          loading: () => const Padding(
            padding: EdgeInsets.all(16),
            child: Center(
              child: SizedBox(
                width: 20, height: 20,
                child: CircularProgressIndicator(strokeWidth: 2),
              ),
            ),
          ),
          error: (_, __) => const Padding(
            padding: EdgeInsets.all(16),
            child: Text('Arama hatası', style: TextStyle(color: AppColors.wrong)),
          ),
          data: (results) {
            if (results.isEmpty) {
              return const Padding(
                padding: EdgeInsets.all(16),
                child: Text(
                  'Sonuç bulunamadı',
                  style: TextStyle(color: AppColors.textSecondary),
                ),
              );
            }

            final limited = results.take(widget.maxResults).toList();
            return ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: limited.length,
              separatorBuilder: (_, __) => Divider(
                height: 1,
                color: AppColors.surfaceVariant,
              ),
              itemBuilder: (context, idx) {
                final result = limited[idx];
                return _SearchResultTile(
                  result: result,
                  onTap: () => _onSelect(result),
                );
              },
            );
          },
        ),
      ),
    );
  }

  String get _hintText {
    switch (widget.entityType) {
      case 'player': return 'Futbolcu ara...';
      case 'club': return 'Kulüp ara...';
      case 'national': return 'Milli takım ara...';
      case 'manager': return 'Teknik direktör ara...';
      default: return 'Ara...';
    }
  }
}

class _SearchResultTile extends StatelessWidget {
  final SearchResult result;
  final VoidCallback onTap;

  const _SearchResultTile({required this.result, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        child: Row(
          children: [
            // Bayrak / ikon
            if (result.countryCode != null)
              Text(
                _flagEmoji(result.countryCode!),
                style: const TextStyle(fontSize: 20),
              )
            else
              const Icon(Icons.shield, size: 20, color: AppColors.textSecondary),
            const SizedBox(width: 12),
            // İsim + kulüp
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(result.name, style: AppTextStyles.bodyMedium),
                  if (result.clubName != null)
                    Text(
                      result.clubName!,
                      style: AppTextStyles.bodySmall.copyWith(
                        color: AppColors.textSecondary,
                      ),
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  // Ülke kodu → bayrak emoji (TR → 🇹🇷)
  String _flagEmoji(String countryCode) {
    return countryCode.toUpperCase().runes
        .map((r) => String.fromCharCode(r + 127397))
        .join();
  }
}
```

---

## 6. CEVAP SLOT WIDGET'LARI

```dart
// lib/features/game/presentation/widgets/answer_slot_widget.dart
import 'package:flutter/material.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/constants/app_text_styles.dart';
import '../../domain/search_result_model.dart';

/// Seçilmiş bir cevabı gösteren chip
class AnswerSlotWidget extends StatelessWidget {
  final SearchResult answer;
  final VoidCallback onRemove;

  const AnswerSlotWidget({
    super.key,
    required this.answer,
    required this.onRemove,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: AppColors.primary.withOpacity(0.2),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: AppColors.primary.withOpacity(0.5)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (answer.countryCode != null) ...[
            Text(_flagEmoji(answer.countryCode!),
                style: const TextStyle(fontSize: 16)),
            const SizedBox(width: 6),
          ],
          Text(answer.name, style: AppTextStyles.bodyMedium),
          const SizedBox(width: 6),
          GestureDetector(
            onTap: onRemove,
            child: const Icon(Icons.close, size: 16, color: AppColors.textSecondary),
          ),
        ],
      ),
    );
  }

  String _flagEmoji(String code) {
    return code.toUpperCase().runes
        .map((r) => String.fromCharCode(r + 127397))
        .join();
  }
}

/// Boş slot göstergesi (henüz seçilmemiş)
class EmptySlotWidget extends StatelessWidget {
  const EmptySlotWidget({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 80,
      height: 36,
      decoration: BoxDecoration(
        color: AppColors.surfaceVariant.withOpacity(0.4),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
          color: AppColors.surfaceVariant,
          style: BorderStyle.solid,
        ),
      ),
    );
  }
}
```

---

## 7. BİTİR BUTONU — 3 DURUM

```dart
// lib/features/game/presentation/widgets/finish_button_widget.dart
import 'package:flutter/material.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/constants/app_text_styles.dart';

enum FinishButtonState {
  disabled,    // 0 cevap
  active,      // 1+ cevap, slotlar tam dolmadı
  allFilled,   // Tüm slotlar dolu — süre bonusu kazanabilir
}

class FinishButtonWidget extends StatelessWidget {
  final FinishButtonState buttonState;
  final bool isLoading;
  final VoidCallback? onPressed;

  const FinishButtonWidget({
    super.key,
    required this.buttonState,
    this.isLoading = false,
    this.onPressed,
  });

  @override
  Widget build(BuildContext context) {
    final isDisabled = buttonState == FinishButtonState.disabled || isLoading;
    final isAllFilled = buttonState == FinishButtonState.allFilled;

    Color bgColor;
    String label;
    IconData icon;

    if (isDisabled) {
      bgColor = AppColors.surfaceVariant;
      label = 'Cevap gir ve bitir';
      icon = Icons.check_circle_outline;
    } else if (isAllFilled) {
      bgColor = AppColors.correct;
      label = '🎯 Bitir ve Süre Bonusu Kazan';
      icon = Icons.check_circle;
    } else {
      bgColor = AppColors.primary;
      label = '✓ Bitir ve Sonucu Gör';
      icon = Icons.check_circle_outline;
    }

    return AnimatedContainer(
      duration: const Duration(milliseconds: 250),
      width: double.infinity,
      height: 52,
      child: ElevatedButton(
        onPressed: isDisabled ? null : onPressed,
        style: ElevatedButton.styleFrom(
          backgroundColor: bgColor,
          disabledBackgroundColor: AppColors.surfaceVariant,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
        child: isLoading
            ? const SizedBox(
                width: 22, height: 22,
                child: CircularProgressIndicator(
                  strokeWidth: 2.5,
                  valueColor: AlwaysStoppedAnimation(AppColors.textPrimary),
                ),
              )
            : Text(label, style: AppTextStyles.buttonText),
      ),
    );
  }
}
```

---

## 8. OYUN EKRANI — TAM İMPLEMENTASYON

```dart
// lib/features/game/presentation/game_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/router/route_names.dart';
import '../domain/game_session_model.dart';
import 'game_provider.dart';
import 'widgets/timer_widget.dart';
import 'widgets/autocomplete_widget.dart';
import 'widgets/answer_slot_widget.dart';
import 'widgets/empty_slot_widget.dart';
import 'widgets/finish_button_widget.dart';

// Session provider — challenge intro'dan aktarılır
final activeSessionProvider = StateProvider<GameSession?>((ref) => null);

class GameScreen extends ConsumerWidget {
  final String sessionId;

  const GameScreen({super.key, required this.sessionId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final session = ref.watch(activeSessionProvider);
    if (session == null) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    final gameState = ref.watch(gameNotifierProvider);
    final selectedCount = gameState.selectedAnswers.length;
    final isFull = selectedCount == session.answerCount;

    FinishButtonState buttonState;
    if (selectedCount == 0) {
      buttonState = FinishButtonState.disabled;
    } else if (isFull) {
      buttonState = FinishButtonState.allFilled;
    } else {
      buttonState = FinishButtonState.active;
    }

    return WillPopScope(
      onWillPop: () async {
        // Geri tuşuna basılırsa uyarı göster
        return await _showExitDialog(context) ?? false;
      },
      child: Scaffold(
        backgroundColor: AppColors.background,
        body: SafeArea(
          child: Column(
            children: [
              // Timer + progress bar
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
                child: Row(
                  children: [
                    IconButton(
                      icon: const Icon(Icons.close, color: AppColors.textSecondary),
                      onPressed: () async {
                        final exit = await _showExitDialog(context);
                        if (exit == true && context.mounted) context.go(RouteNames.home);
                      },
                    ),
                    Expanded(
                      child: TimerWidget(
                        startedAt: session.startedAt,
                        timeLimitSeconds: session.timeLimitSeconds,
                        onExpired: () => _onTimerExpired(context, ref, session),
                      ),
                    ),
                  ],
                ),
              ),

              // Soru başlığı
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
                child: Text(
                  session.questionTitle,
                  style: Theme.of(context).textTheme.titleMedium,
                  textAlign: TextAlign.center,
                ),
              ),

              // Modül + zorluk bilgisi
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  _ModuleChip(module: session.module),
                  const SizedBox(width: 8),
                  _DifficultyChip(difficulty: session.difficulty),
                  const SizedBox(width: 8),
                  Text(
                    '${session.answerCount} cevap',
                    style: const TextStyle(color: AppColors.textSecondary, fontSize: 13),
                  ),
                ],
              ),

              const SizedBox(height: 16),
              const Divider(height: 1, color: AppColors.surfaceVariant),
              const SizedBox(height: 16),

              // Autocomplete
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: AutocompleteWidget(
                  entityType: session.module,
                ),
              ),

              const SizedBox(height: 16),

              // Seçilen cevaplar + boş slotlar
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Seçtiklerin ($selectedCount/${session.answerCount}):',
                        style: const TextStyle(
                          color: AppColors.textSecondary,
                          fontSize: 13,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: [
                          // Dolu slotlar
                          ...gameState.selectedAnswers.map((answer) =>
                            AnswerSlotWidget(
                              answer: answer,
                              onRemove: () => ref
                                  .read(gameNotifierProvider.notifier)
                                  .removeAnswer(answer.entityId),
                            ),
                          ),
                          // Boş slotlar
                          ...List.generate(
                            session.answerCount - selectedCount,
                            (_) => const EmptySlotWidget(),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),

              // Bitir butonu
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
                child: FinishButtonWidget(
                  buttonState: buttonState,
                  isLoading: gameState.isSubmitting,
                  onPressed: selectedCount > 0
                      ? () => _submit(context, ref, session)
                      : null,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _submit(
    BuildContext context,
    WidgetRef ref,
    GameSession session,
  ) async {
    try {
      await ref.read(gameNotifierProvider.notifier).submit(session.sessionId);
      if (context.mounted) {
        context.go('/result/${session.sessionId}');
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Gönderme hatası: $e'),
            backgroundColor: AppColors.wrong,
          ),
        );
      }
    }
  }

  void _onTimerExpired(
    BuildContext context,
    WidgetRef ref,
    GameSession session,
  ) {
    // Süre doldu — cevap sayısına bakılmaksızın otomatik gönder
    final selectedCount = ref.read(gameNotifierProvider).selectedAnswers.length;

    if (selectedCount > 0) {
      _submit(context, ref, session);
    } else {
      // 0 cevap: sunucuya boş submit gönder (0 puan, cooldown başlar)
      ref.read(gameNotifierProvider.notifier).submit(session.sessionId).then((_) {
        if (context.mounted) {
          context.go('/result/${session.sessionId}');
        }
      });
    }
  }

  Future<bool?> _showExitDialog(BuildContext context) {
    return showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.surface,
        title: const Text('Çıkmak istiyor musun?'),
        content: const Text(
          'Çıkarsan süre akmaya devam eder ve bu hakkın yanmış sayılır.',
          style: TextStyle(color: AppColors.textSecondary),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('İptal'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Çık', style: TextStyle(color: AppColors.wrong)),
          ),
        ],
      ),
    );
  }
}

class _ModuleChip extends StatelessWidget {
  final String module;
  const _ModuleChip({required this.module});

  @override
  Widget build(BuildContext context) {
    final labels = {
      'players': '⚽ Oyuncu',
      'clubs': '🏟️ Kulüp',
      'nationals': '🌍 Milli',
      'managers': '👔 Teknik D.',
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: AppColors.surfaceVariant,
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        labels[module] ?? module,
        style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
      ),
    );
  }
}

class _DifficultyChip extends StatelessWidget {
  final String difficulty;
  const _DifficultyChip({required this.difficulty});

  @override
  Widget build(BuildContext context) {
    final labels = {'easy': '⭐☆☆', 'medium': '⭐⭐☆', 'hard': '⭐⭐⭐'};
    return Text(
      labels[difficulty] ?? difficulty,
      style: const TextStyle(fontSize: 14),
    );
  }
}
```

---

## 9. SONUÇ EKRANI — BLUR + PUAN ANİMASYONU + REKLAM

```dart
// lib/features/result/presentation/result_screen.dart
import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_text_styles.dart';
import '../../../core/router/route_names.dart';
import '../domain/result_model.dart';
import 'result_provider.dart';
import 'widgets/score_counter_widget.dart';
import 'widgets/answer_row_widget.dart';
import 'widgets/rank_change_widget.dart';
import 'widgets/ad_reward_button_widget.dart';

class ResultScreen extends ConsumerWidget {
  final String sessionId;

  const ResultScreen({super.key, required this.sessionId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final resultAsync = ref.watch(sessionResultProvider(sessionId));

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: resultAsync.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (err, _) => Center(
            child: Text('Sonuç yüklenemedi', style: AppTextStyles.bodyMedium),
          ),
          data: (result) => _buildResult(context, ref, result),
        ),
      ),
    );
  }

  Widget _buildResult(BuildContext context, WidgetRef ref, SessionResult result) {
    return SingleChildScrollView(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            // Başlık
            Text('SONUÇ', style: AppTextStyles.titleLarge)
                .animate().fadeIn(delay: 200.ms),

            const SizedBox(height: 4),

            Text(
              '${result.correctCount} / ${result.totalCount} Doğru',
              style: AppTextStyles.titleMedium.copyWith(
                color: AppColors.textSecondary,
              ),
            ).animate().fadeIn(delay: 300.ms),

            const SizedBox(height: 16),

            // Puan kutusu — sayma animasyonu
            ScoreCounterWidget(score: result.scoreFinal)
                .animate().fadeIn(delay: 400.ms).slideY(begin: 0.3, end: 0),

            const SizedBox(height: 24),
            const Divider(color: AppColors.surfaceVariant),
            const SizedBox(height: 16),

            // Cevap listesi
            ...result.answers.asMap().entries.map((entry) {
              return AnswerRowWidget(
                answer: entry.value,
                index: entry.key,
              ).animate().fadeIn(delay: (500 + entry.key * 80).ms);
            }),

            // Yanlış girilen cevaplar
            if (result.wrongEntityNames.isNotEmpty) ...[
              const SizedBox(height: 16),
              const Divider(color: AppColors.surfaceVariant),
              const SizedBox(height: 8),
              Align(
                alignment: Alignment.centerLeft,
                child: Text(
                  'Yanlış girdiğin:',
                  style: AppTextStyles.bodySmall.copyWith(
                    color: AppColors.textSecondary,
                  ),
                ),
              ),
              const SizedBox(height: 8),
              ...result.wrongEntityNames.map((name) =>
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 2),
                  child: Row(
                    children: [
                      const Text('❌', style: TextStyle(fontSize: 14)),
                      const SizedBox(width: 8),
                      Text(
                        '$name  (bu listede değil)',
                        style: AppTextStyles.bodySmall.copyWith(
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],

            const SizedBox(height: 16),
            const Divider(color: AppColors.surfaceVariant),
            const SizedBox(height: 8),

            // Sıralama değişimi
            RankChangeWidget(result: result),

            const SizedBox(height: 16),

            // Reklam butonu
            if (!result.adMultiplied)
              AdRewardButtonWidget(sessionId: sessionId),

            const SizedBox(height: 24),

            // Alt butonlar
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () => _share(result),
                    icon: const Icon(Icons.share_outlined),
                    label: const Text('Paylaş'),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppColors.textPrimary,
                      side: const BorderSide(color: AppColors.surfaceVariant),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () => context.go(RouteNames.leaderboard),
                    icon: const Icon(Icons.emoji_events_outlined),
                    label: const Text('Sıralama'),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppColors.textPrimary,
                      side: const BorderSide(color: AppColors.surfaceVariant),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: () => context.go(RouteNames.home),
                    icon: const Icon(Icons.home),
                    label: const Text('Ana Ekran'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  void _share(SessionResult result) {
    // TODO: Share plugin entegrasyonu
  }
}
```

---

## 10. ANSWER ROW WIDGET — BLUR EFEKTİ

```dart
// lib/features/result/presentation/widgets/answer_row_widget.dart
import 'dart:ui';
import 'package:flutter/material.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/constants/app_text_styles.dart';
import '../../domain/result_model.dart';

class AnswerRowWidget extends StatelessWidget {
  final AnswerRow answer;
  final int index;

  const AnswerRowWidget({
    super.key,
    required this.answer,
    required this.index,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          // Sıra numarası
          SizedBox(
            width: 28,
            child: Text(
              '${answer.rank}.',
              style: AppTextStyles.bodySmall.copyWith(
                color: AppColors.textSecondary,
              ),
            ),
          ),

          // Durum ikonu
          _StatusIcon(status: answer.status),
          const SizedBox(width: 10),

          // İsim (blur veya gerçek)
          Expanded(
            child: answer.status == AnswerRowStatus.blurred
                ? _BlurredName()
                : Text(
                    '${_flag(answer.countryCode)}  ${answer.entityName ?? ''}',
                    style: AppTextStyles.bodyMedium,
                  ),
          ),

          // İstatistik değeri (blur veya gerçek)
          answer.status == AnswerRowStatus.blurred
              ? _BlurredStat()
              : Text(
                  answer.statDisplay ?? '',
                  style: AppTextStyles.bodySmall.copyWith(
                    color: AppColors.textSecondary,
                  ),
                ),
        ],
      ),
    );
  }

  String _flag(String? code) {
    if (code == null) return '';
    return code.toUpperCase().runes
        .map((r) => String.fromCharCode(r + 127397))
        .join();
  }
}

class _StatusIcon extends StatelessWidget {
  final AnswerRowStatus status;
  const _StatusIcon({required this.status});

  @override
  Widget build(BuildContext context) {
    switch (status) {
      case AnswerRowStatus.correct:
        return const Text('✅', style: TextStyle(fontSize: 16));
      case AnswerRowStatus.blurred:
        return const Icon(Icons.circle, size: 16, color: AppColors.primary);
      case AnswerRowStatus.wrong:
        return const Icon(Icons.circle_outlined, size: 16, color: AppColors.surfaceVariant);
    }
  }
}

/// Frosted glass blur efekti — premium olmayan kullanıcıya gösterilir
class _BlurredName extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(4),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 8, sigmaY: 8),
        child: Container(
          height: 20,
          width: 130,
          decoration: BoxDecoration(
            color: AppColors.blur.withOpacity(0.3),
            borderRadius: BorderRadius.circular(4),
          ),
        ),
      ),
    );
  }
}

class _BlurredStat extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(4),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 8, sigmaY: 8),
        child: Container(
          height: 16,
          width: 55,
          decoration: BoxDecoration(
            color: AppColors.blur.withOpacity(0.3),
            borderRadius: BorderRadius.circular(4),
          ),
        ),
      ),
    );
  }
}
```

---

## 11. PUAN SAYACI ANİMASYONU

```dart
// lib/features/result/presentation/widgets/score_counter_widget.dart
import 'package:flutter/material.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/constants/app_text_styles.dart';

class ScoreCounterWidget extends StatelessWidget {
  final int score;

  const ScoreCounterWidget({super.key, required this.score});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 20),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: score > 0 ? AppColors.primary.withOpacity(0.4) : AppColors.surfaceVariant,
        ),
      ),
      child: Column(
        children: [
          const Text('🏆', style: TextStyle(fontSize: 32)),
          const SizedBox(height: 8),
          // TweenAnimationBuilder ile 0'dan score'a sayar
          TweenAnimationBuilder<double>(
            tween: Tween(begin: 0, end: score.toDouble()),
            duration: const Duration(milliseconds: 1200),
            curve: Curves.easeOut,
            builder: (context, value, child) {
              return Text(
                value.toInt().toString(),
                style: AppTextStyles.scoreCounter,
              );
            },
          ),
          const SizedBox(height: 4),
          Text(
            'puan',
            style: AppTextStyles.bodySmall.copyWith(
              color: AppColors.textSecondary,
            ),
          ),
        ],
      ),
    );
  }
}
```

---

## 12. KESİNLİKLE YAPILMAYACAKLAR

- Timer `DateTime.now()` ile client-side başlatılmaz. Her zaman sunucudan gelen `startedAt` kullanılır.
- Blur için `Opacity` veya sadece renk kullanılmaz. `BackdropFilter` + `ImageFilter.blur` zorunludur.
- Autocomplete debounce olmadan her tuş vuruşunda API çağrısı yapılmaz. 300ms debounce şarttır.
- Seçilen entity'ler arama sonuçlarında gösterilmez (çift ekleme engellemesi hem provider'da hem de arama filtresinde uygulanır).
- Süre dolduğunda 0 cevap bile olsa submit gönderilir (cooldown başlaması için).
- Sonuç ekranında yanlış giriş yanına sıra bilgisi (kaçıncı sıra olduğu) yazılmaz.
- Reklam butonu `adMultiplied = true` ise tamamen gizlenir, disabled gösterilmez.
- Blur widget'ı premium kullanıcılarda render edilmez (sunucudan gerçek veri gelir, `blurred` status gelmez).
