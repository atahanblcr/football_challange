import 'package:flutter/material.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/constants/app_text_styles.dart';

enum FinishButtonState {
  disabled,
  active,
  allFilled,
}

class FinishButtonWidget extends StatelessWidget {
  final FinishButtonState state;
  final bool isLoading;
  final VoidCallback? onPressed;

  const FinishButtonWidget({
    super.key,
    required this.state,
    this.isLoading = false,
    this.onPressed,
  });

  @override
  Widget build(BuildContext context) {
    final isDisabled = state == FinishButtonState.disabled || isLoading;
    final isAllFilled = state == FinishButtonState.allFilled;

    return AnimatedContainer(
      duration: const Duration(milliseconds: 250),
      width: double.infinity,
      height: 52,
      child: ElevatedButton(
        onPressed: isDisabled ? null : onPressed,
        style: ElevatedButton.styleFrom(
          backgroundColor: isAllFilled ? AppColors.correct : AppColors.primary,
          disabledBackgroundColor: AppColors.surfaceVariant,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        ),
        child: isLoading
            ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(strokeWidth: 3, color: Colors.white))
            : Text(
                isAllFilled ? '🎯 Bitir ve Bonus Kazan!' : '✓ Bitir',
                style: AppTextStyles.buttonText,
              ),
      ),
    );
  }
}
