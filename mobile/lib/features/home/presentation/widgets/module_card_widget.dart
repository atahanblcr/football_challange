import 'package:flutter/material.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/constants/app_text_styles.dart';
import '../../domain/daily_question_model.dart';

class ModuleCardWidget extends StatelessWidget {
  final DailyQuestion question;
  final VoidCallback onTap;

  const ModuleCardWidget({
    super.key,
    required this.question,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final isCompleted = question.isCompleted;

    return GestureDetector(
      onTap: isCompleted ? null : onTap,
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: isCompleted ? AppColors.surfaceVariant.withOpacity(0.3) : AppColors.surface,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isCompleted ? Colors.transparent : AppColors.primary.withOpacity(0.3),
            width: 1,
          ),
          boxShadow: isCompleted ? [] : [
            BoxShadow(
              color: AppColors.primary.withOpacity(0.1),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                _buildIcon(question.module),
                if (isCompleted)
                  const Icon(Icons.check_circle, color: AppColors.correct, size: 24)
                else
                  _buildDifficulty(question.difficulty),
              ],
            ),
            const Spacer(),
            Text(
              _getModuleLabel(question.module),
              style: AppTextStyles.titleSmall.copyWith(
                color: isCompleted ? AppColors.textSecondary : AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              isCompleted ? 'Puan: ${question.score}' : '${question.answerCount} Soru • ${question.timeLimit}s',
              style: AppTextStyles.bodySmall,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildIcon(String module) {
    String icon = '⚽';
    if (module == 'clubs') icon = '🏟️';
    if (module == 'nationals') icon = '🌍';
    if (module == 'managers') icon = '👔';
    
    return Text(icon, style: const TextStyle(fontSize: 32));
  }

  Widget _buildDifficulty(String difficulty) {
    String stars = '⭐☆☆';
    if (difficulty == 'medium') stars = '⭐⭐☆';
    if (difficulty == 'hard') stars = '⭐⭐⭐';
    
    return Text(stars, style: const TextStyle(fontSize: 12));
  }

  String _getModuleLabel(String module) {
    if (module == 'players') return 'Oyuncular';
    if (module == 'clubs') return 'Kulüpler';
    if (module == 'nationals') return 'Milli Takımlar';
    if (module == 'managers') return 'Teknik D.';
    return module;
  }
}
