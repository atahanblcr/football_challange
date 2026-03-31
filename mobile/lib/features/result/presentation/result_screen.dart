import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_text_styles.dart';
import '../../../core/router/route_names.dart';
import '../domain/result_model.dart';
import 'result_provider.dart';
import 'widgets/score_counter_widget.dart';
import 'widgets/answer_row_widget.dart';
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
          error: (err, _) => Center(child: Text('Hata: $err', style: const TextStyle(color: Colors.white))),
          data: (result) => _buildContent(context, ref, result),
        ),
      ),
    );
  }

  Widget _buildScoreRow(String label, String value, IconData icon, {Color? color}) {
    return Row(
      children: [
        Icon(icon, size: 16, color: color ?? AppColors.textSecondary),
        const SizedBox(width: 8),
        Text(label, style: AppTextStyles.bodySmall.copyWith(color: AppColors.textSecondary)),
        const Spacer(),
        Text(value, style: AppTextStyles.bodyMedium.copyWith(
          fontWeight: FontWeight.bold,
          color: color ?? Colors.white,
        )),
      ],
    );
  }

  Widget _buildContent(BuildContext context, WidgetRef ref, SessionResult result) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        children: [
          const Text('OYUN TAMAMLANDI', style: AppTextStyles.labelSmall)
              .animate().fadeIn().slideY(begin: -0.5, end: 0),
          const SizedBox(height: 8),
          Text(result.questionTitle, style: AppTextStyles.titleMedium, textAlign: TextAlign.center),
          
          const SizedBox(height: 32),
          
          ScoreCounterWidget(score: result.scoreFinal)
              .animate().scale(duration: 600.ms, curve: Curves.easeOutBack),
          
          const SizedBox(height: 16),
          
          // Score Breakdown
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.surfaceVariant),
            ),
            child: Column(
              children: [
                _buildScoreRow('Cevap Puanı', '${result.scoreBase}', Icons.check_circle_outline),
                const SizedBox(height: 8),
                _buildScoreRow('Süre Bonusu', '+${result.scoreTimeBonus}', Icons.timer_outlined, color: AppColors.warning),
                const SizedBox(height: 8),
                _buildScoreRow('Zorluk Çarpanı', 'x${(result.scoreDifficulty / (result.scoreBase + result.scoreTimeBonus)).toStringAsFixed(2)}', Icons.bolt, color: AppColors.primaryLight),
                if (result.adMultiplied) ...[
                  const SizedBox(height: 8),
                  const Divider(color: Colors.white10),
                  const SizedBox(height: 8),
                  _buildScoreRow('Reklam Bonusu', 'x1.50', Icons.play_circle_outline, color: AppColors.correct),
                ],
              ],
            ),
          ).animate().fadeIn(delay: 400.ms).slideY(begin: 0.1, end: 0),
          
          const SizedBox(height: 32),
          
          const Divider(color: AppColors.surfaceVariant),
          
          const SizedBox(height: 16),
          
          // Answers
          ...result.answers.map((ans) => AnswerRowWidget(answer: ans)
              .animate().fadeIn(delay: (300 + ans.rank * 50).ms).slideX(begin: 0.1, end: 0)),
          
          const SizedBox(height: 24),
          
          if (!result.adMultiplied)
            AdRewardButtonWidget(sessionId: sessionId)
                .animate().fadeIn(delay: 800.ms),
          
          const SizedBox(height: 32),
          
          // Action Buttons
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () => context.go(RouteNames.home),
                  icon: const Icon(Icons.home),
                  label: const Text('Ana Ekran'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Colors.white,
                    side: const BorderSide(color: AppColors.surfaceVariant),
                    minimumSize: const Size(0, 52),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: () => context.go(RouteNames.leaderboard),
                  icon: const Icon(Icons.leaderboard),
                  label: const Text('Sıralama'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: Colors.white,
                    minimumSize: const Size(0, 52),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                ),
              ),
            ],
          ).animate().fadeIn(delay: 1000.ms),
        ],
      ),
    );
  }
}
