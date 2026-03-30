import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_text_styles.dart';
import '../../../core/router/route_names.dart';
import '../domain/game_session_model.dart';
import 'game_provider.dart';
import 'widgets/timer_widget.dart';
import 'widgets/autocomplete_widget.dart';
import 'widgets/answer_slot_widget.dart';
import 'widgets/finish_button_widget.dart';

final activeSessionProvider = StateProvider<GameSession?>((ref) => null);

class GameScreen extends ConsumerWidget {
  final String sessionId;

  const GameScreen({super.key, required this.sessionId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final session = ref.watch(activeSessionProvider);
    if (session == null) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    final gameState = ref.watch(gameNotifierProvider(sessionId));
    final selectedCount = gameState.selectedAnswers.length;
    final isFull = selectedCount == session.answerCount;

    FinishButtonState buttonState = FinishButtonState.disabled;
    if (selectedCount > 0) {
      buttonState = isFull ? FinishButtonState.allFilled : FinishButtonState.active;
    }

    return PopScope(
      canPop: false,
      onPopInvoked: (didPop) async {
        if (didPop) return;
        final shouldPop = await _showExitDialog(context);
        if (shouldPop == true && context.mounted) {
          context.go(RouteNames.home);
        }
      },
      child: Scaffold(
        backgroundColor: AppColors.background,
        body: SafeArea(
          child: Column(
            children: [
              // Header & Timer
              Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    IconButton(
                      icon: const Icon(Icons.close, color: AppColors.textSecondary),
                      onPressed: () async {
                        if (await _showExitDialog(context) == true) context.go(RouteNames.home);
                      },
                    ),
                    Expanded(
                      child: TimerWidget(
                        startedAt: session.startedAt,
                        timeLimitSeconds: session.timeLimitSeconds,
                        onExpired: () => _submit(context, ref, session),
                      ),
                    ),
                  ],
                ),
              ),

              // Question Title
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
                child: Text(
                  session.questionTitle,
                  style: AppTextStyles.titleMedium,
                  textAlign: TextAlign.center,
                ),
              ),

              const SizedBox(height: 16),
              
              // Autocomplete
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                child: AutocompleteWidget(
                  entityType: session.module,
                  sessionId: sessionId,
                ),
              ),

              const SizedBox(height: 24),

              // Slots Area
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 24),
                  child: SingleChildScrollView(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Cevapların ($selectedCount/${session.answerCount}):', style: AppTextStyles.labelSmall),
                        const SizedBox(height: 12),
                        Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          children: [
                            ...gameState.selectedAnswers.map((a) => AnswerSlotWidget(
                              answer: a,
                              onRemove: () => ref.read(gameNotifierProvider(sessionId).notifier).removeAnswer(a.entityId),
                            )),
                            ...List.generate(session.answerCount - selectedCount, (_) => const EmptySlotWidget()),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              ),

              // Footer
              Padding(
                padding: const EdgeInsets.all(24),
                child: FinishButtonWidget(
                  state: buttonState,
                  isLoading: gameState.isSubmitting,
                  onPressed: () => _submit(context, ref, session),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _submit(BuildContext context, WidgetRef ref, GameSession session) async {
    try {
      await ref.read(gameNotifierProvider(session.sessionId).notifier).submit(session.sessionId);
      if (context.mounted) {
        context.pushReplacementNamed(
          RouteNames.result,
          pathParameters: {'sessionId': session.sessionId},
        );
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
      }
    }
  }

  Future<bool?> _showExitDialog(BuildContext context) {
    return showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.surface,
        title: const Text('Oyundan çıkmak istiyor musun?'),
        content: const Text('Çıkarsan süre dolduğunda 0 puan alırsın ve bu hakkın yanar.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Devam Et')),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true), 
            child: const Text('Çık', style: TextStyle(color: AppColors.wrong))
          ),
        ],
      ),
    );
  }
}
