import 'package:flutter/material.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/constants/app_text_styles.dart';

class ScoreCounterWidget extends StatelessWidget {
  final int score;

  const ScoreCounterWidget({super.key, required this.score});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 24),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(
          color: score > 0 ? AppColors.primary.withOpacity(0.4) : AppColors.surfaceVariant,
          width: 2,
        ),
        boxShadow: [
          if (score > 0) BoxShadow(
            color: AppColors.primary.withOpacity(0.2),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        children: [
          const Text('🏆', style: TextStyle(fontSize: 40)),
          const SizedBox(height: 12),
          TweenAnimationBuilder<double>(
            tween: Tween(begin: 0, end: score.toDouble()),
            duration: const Duration(milliseconds: 1500),
            curve: Curves.easeOutCubic,
            builder: (context, value, child) {
              return Text(
                value.toInt().toString(),
                style: AppTextStyles.scoreCounter,
              );
            },
          ),
          Text(
            'PUAN',
            style: AppTextStyles.labelSmall.copyWith(letterSpacing: 2),
          ),
        ],
      ),
    );
  }
}
