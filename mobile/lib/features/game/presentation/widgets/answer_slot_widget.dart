import 'package:flutter/material.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/constants/app_text_styles.dart';
import '../../domain/search_result_model.dart';

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
        color: AppColors.primary.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.primary.withOpacity(0.3)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(_flagEmoji(answer.countryCode), style: const TextStyle(fontSize: 16)),
          const SizedBox(width: 8),
          Flexible(child: Text(answer.name, style: AppTextStyles.bodyMedium, overflow: TextOverflow.ellipsis)),
          const SizedBox(width: 8),
          GestureDetector(
            onTap: onRemove,
            child: const Icon(Icons.close, size: 16, color: AppColors.textSecondary),
          ),
        ],
      ),
    );
  }

  String _flagEmoji(String? code) {
    if (code == null || code.isEmpty) return '🏳️';
    return code.toUpperCase().runes.map((r) => String.fromCharCode(r + 127397)).join();
  }
}

class EmptySlotWidget extends StatelessWidget {
  const EmptySlotWidget({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 80,
      height: 36,
      decoration: BoxDecoration(
        color: AppColors.surfaceVariant.withOpacity(0.2),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.surfaceVariant.withOpacity(0.5), style: BorderStyle.solid),
      ),
    );
  }
}
