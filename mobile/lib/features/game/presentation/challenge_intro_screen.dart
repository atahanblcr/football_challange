import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_text_styles.dart';
import '../../../core/router/route_names.dart';
import '../../../shared/widgets/primary_button_widget.dart';
import '../data/game_repository.dart';
import 'game_screen.dart';

class ChallengeIntroScreen extends ConsumerStatefulWidget {
  final String questionId;
  final String module;
  final String difficulty;
  final int answerCount;
  final int timeLimit;

  const ChallengeIntroScreen({
    super.key,
    required this.questionId,
    required this.module,
    required this.difficulty,
    required this.answerCount,
    required this.timeLimit,
  });

  @override
  ConsumerState<ChallengeIntroScreen> createState() => _ChallengeIntroScreenState();
}

class _ChallengeIntroScreenState extends ConsumerState<ChallengeIntroScreen> {
  bool _isLoading = false;

  Future<void> _onStart() async {
    setState(() => _isLoading = true);
    try {
      final session = await ref.read(gameRepositoryProvider).startQuestion(widget.questionId);
      
      // Meta verileri session modeline enjekte et (Backend sadece sessionId, title ve startedAt dönüyor)
      final fullSession = session.copyWith(
        module: widget.module,
        difficulty: widget.difficulty,
        answerCount: widget.answerCount,
        timeLimit: widget.timeLimit,
      );

      ref.read(activeSessionProvider.notifier).state = fullSession;
      
      if (mounted) {
        context.pushReplacementNamed(
          RouteNames.game,
          pathParameters: {'sessionId': fullSession.sessionId},
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString()), backgroundColor: AppColors.wrong),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(backgroundColor: Colors.transparent, elevation: 0),
      body: Padding(
        padding: const EdgeInsets.all(32.0),
        child: Column(
          children: [
            const Spacer(),
            _buildModuleIcon(widget.module)
                .animate().scale(duration: 600.ms, curve: Curves.easeOutBack),
            const SizedBox(height: 32),
            const Text(
              'Challenge Başlıyor!',
              style: AppTextStyles.titleLarge,
              textAlign: TextAlign.center,
            ).animate().fadeIn(delay: 200.ms),
            const SizedBox(height: 16),
            const Text(
              'Sorunun başlığını "Başla" butonuna bastıktan sonra göreceksin. Hazır mısın?',
              style: AppTextStyles.bodyLarge,
              textAlign: TextAlign.center,
            ).animate().fadeIn(delay: 400.ms),
            const SizedBox(height: 48),
            
            // Meta Info
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(24),
                border: Border.all(color: AppColors.surfaceVariant),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  _buildMetaItem('Süre', '${widget.timeLimit}s', Icons.timer_outlined),
                  _buildMetaItem('Cevap', '${widget.answerCount}', Icons.fact_check_outlined),
                  _buildMetaItem('Zorluk', _getDifficultyLabel(widget.difficulty), Icons.bolt),
                ],
              ),
            ).animate().fadeIn(delay: 600.ms).slideY(begin: 0.2, end: 0),
            
            const Spacer(),
            
            PrimaryButton(
              label: 'Hadi Başlayalım! 🎯',
              isLoading: _isLoading,
              onPressed: _onStart,
            ).animate().fadeIn(delay: 800.ms),
            const SizedBox(height: 16),
            const Text(
              'Not: Çıkarsan hakkın yanmış sayılır.',
              style: TextStyle(color: Colors.white24, fontSize: 12),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMetaItem(String label, String value, IconData icon) {
    return Column(
      children: [
        Icon(icon, color: AppColors.primaryLight, size: 24),
        const SizedBox(height: 8),
        Text(value, style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
        Text(label, style: const TextStyle(fontSize: 10, color: AppColors.textSecondary)),
      ],
    );
  }

  Widget _buildModuleIcon(String module) {
    String icon = '⚽';
    if (module == 'clubs') icon = '🏟️';
    if (module == 'nationals') icon = '🌍';
    if (module == 'managers') icon = '👔';
    return Text(icon, style: const TextStyle(fontSize: 100));
  }

  String _getDifficultyLabel(String d) {
    if (d == 'easy') return 'Kolay';
    if (d == 'medium') return 'Orta';
    if (d == 'hard') return 'Zor';
    return d;
  }
}
