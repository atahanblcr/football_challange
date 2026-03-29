import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_text_styles.dart';
import '../../../shared/widgets/primary_button_widget.dart';

class ForceUpdateScreen extends StatelessWidget {
  const ForceUpdateScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: Padding(
        padding: const EdgeInsets.all(32.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Text(
              '🚀',
              style: TextStyle(fontSize: 80),
            ),
            const SizedBox(height: 32),
            const Text(
              'Yeni Versiyon Hazır!',
              style: AppTextStyles.titleLarge,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            const Text(
              'Uygulamanın en yeni özelliklerini kullanabilmek ve kesintisiz deneyim için lütfen güncelleyin.',
              style: AppTextStyles.bodyLarge,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 48),
            PrimaryButton(
              label: 'Şimdi Güncelle',
              onPressed: () => _launchStore(),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _launchStore() async {
    // TODO: Gerçek mağaza linklerini ekle
    final url = Uri.parse('https://footballchallenge.app');
    if (await canLaunchUrl(url)) {
      await launchUrl(url, mode: LaunchMode.externalApplication);
    }
  }
}
