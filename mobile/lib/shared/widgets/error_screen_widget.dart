import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_text_styles.dart';
import 'primary_button_widget.dart';

class ErrorScreenWidget extends StatelessWidget {
  final String? message;
  final VoidCallback? onRetry;

  const ErrorScreenWidget({
    super.key,
    this.message,
    this.onRetry,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Text('😕', style: TextStyle(fontSize: 64)),
            const SizedBox(height: 24),
            Text(
              message ?? 'Bir şeyler ters gitti',
              style: AppTextStyles.titleMedium,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 32),
            if (onRetry != null)
              PrimaryButton(
                label: 'Tekrar Dene',
                onPressed: onRetry,
              ),
          ],
        ),
      ),
    );
  }
}
