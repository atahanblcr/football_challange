import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_text_styles.dart';
import '../../../shared/providers/auth_provider.dart';

class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Ayarlar', style: AppTextStyles.titleSmall),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          _buildSection('HESAP'),
          _buildTile(Icons.person_outline, 'Bilgileri Güncelle', () {}),
          _buildTile(Icons.notifications_outlined, 'Bildirimler', () {}),
          
          const SizedBox(height: 32),
          
          _buildSection('UYGULAMA'),
          _buildTile(Icons.info_outline, 'Hakkımızda', () {}),
          _buildTile(Icons.privacy_tip_outlined, 'Gizlilik Politikası', () {}),
          _buildTile(Icons.help_outline, 'Yardım & Destek', () {}),
          
          const SizedBox(height: 48),
          
          ElevatedButton(
            onPressed: () => ref.read(authStateProvider.notifier).logout(),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.wrong.withOpacity(0.1),
              foregroundColor: AppColors.wrong,
              elevation: 0,
              side: const BorderSide(color: AppColors.wrong, width: 0.5),
            ),
            child: const Text('Oturumu Kapat'),
          ),
          
          const SizedBox(height: 16),
          const Center(
            child: Text('v1.0.0', style: TextStyle(color: Colors.white10, fontSize: 10)),
          ),
        ],
      ),
    );
  }

  Widget _buildSection(String title) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Text(
        title,
        style: AppTextStyles.labelSmall.copyWith(letterSpacing: 1),
      ),
    );
  }

  Widget _buildTile(IconData icon, String label, VoidCallback onTap) {
    return ListTile(
      leading: Icon(icon, color: AppColors.textSecondary, size: 20),
      title: Text(label, style: AppTextStyles.bodyMedium),
      trailing: const Icon(Icons.chevron_right, color: Colors.white10, size: 16),
      contentPadding: EdgeInsets.zero,
      onTap: onTap,
    );
  }
}
