import 'package:flutter/material.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_text_styles.dart';

class BanScreen extends StatelessWidget {
  const BanScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: Padding(
        padding: const EdgeInsets.all(32.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Text('🚫', style: TextStyle(fontSize: 80)),
            const SizedBox(height: 32),
            const Text(
              'Hesabınız Askıya Alındı',
              style: AppTextStyles.titleLarge,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            const Text(
              'Kullanım koşullarını ihlal ettiğiniz tespit edildiği için hesabınız kalıcı olarak kapatılmıştır.',
              style: AppTextStyles.bodyLarge,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 48),
            Text(
              'Destek için: support@footballchallenge.app',
              style: AppTextStyles.bodySmall,
            ),
          ],
        ),
      ),
    );
  }
}
