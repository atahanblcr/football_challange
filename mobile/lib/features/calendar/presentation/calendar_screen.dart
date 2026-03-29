import 'package:flutter/material.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_text_styles.dart';

class CalendarScreen extends StatelessWidget {
  const CalendarScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('TAKVİM', style: AppTextStyles.titleLarge),
              const SizedBox(height: 8),
              const Text('Geçmiş challenge\'ları incele ve arşive göz at.', style: AppTextStyles.bodySmall),
              const Expanded(
                child: Center(
                  child: Text('Çok Yakında...', style: TextStyle(color: Colors.white24)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
