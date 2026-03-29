import 'dart:ui';
import 'package:flutter/material.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/constants/app_text_styles.dart';
import '../../domain/result_model.dart';

class AnswerRowWidget extends StatelessWidget {
  final AnswerRow answer;

  const AnswerRowWidget({super.key, required this.answer});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        children: [
          SizedBox(
            width: 24,
            child: Text('${answer.rank}.', style: AppTextStyles.bodySmall),
          ),
          _StatusIcon(status: answer.status),
          const SizedBox(width: 12),
          Expanded(
            child: answer.status == AnswerRowStatus.blurred
                ? _BlurredBox(width: 120, height: 18)
                : Text(
                    '${_flag(answer.countryCode)} ${answer.entityName ?? ""}',
                    style: AppTextStyles.bodyMedium.copyWith(
                      fontWeight: answer.status == AnswerRowStatus.correct ? FontWeight.bold : FontWeight.normal,
                    ),
                  ),
          ),
          answer.status == AnswerRowStatus.blurred
              ? _BlurredBox(width: 60, height: 14)
              : Text(
                  answer.statDisplay ?? "",
                  style: AppTextStyles.bodySmall,
                ),
        ],
      ),
    );
  }

  String _flag(String? code) {
    if (code == null || code.isEmpty) return '';
    return code.toUpperCase().runes.map((r) => String.fromCharCode(r + 127397)).join();
  }
}

class _StatusIcon extends StatelessWidget {
  final AnswerRowStatus status;
  const _StatusIcon({required this.status});

  @override
  Widget build(BuildContext context) {
    if (status == AnswerRowStatus.correct) return const Text('✅', style: TextStyle(fontSize: 14));
    if (status == AnswerRowStatus.blurred) return const Icon(Icons.circle, size: 14, color: AppColors.primary);
    return const Icon(Icons.circle_outlined, size: 14, color: AppColors.surfaceVariant);
  }
}

class _BlurredBox extends StatelessWidget {
  final double width;
  final double height;
  const _BlurredBox({required this.width, required this.height});

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(4),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 6, sigmaY: 6),
        child: Container(
          width: width,
          height: height,
          color: AppColors.blur.withOpacity(0.2),
        ),
      ),
    );
  }
}
