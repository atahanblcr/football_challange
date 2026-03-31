import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_text_styles.dart';
import '../../../shared/providers/auth_provider.dart';

class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  void _showInfo(BuildContext context, String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message, style: const TextStyle(color: Colors.white)),
        backgroundColor: AppColors.surfaceVariant,
        behavior: SnackBarBehavior.floating,
        duration: const Duration(seconds: 2),
      ),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Ayarlar', style: AppTextStyles.titleSmall),
        backgroundColor: Colors.transparent,
        elevation: 0,
        centerTitle: true,
      ),
      body: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          _buildSection('HESAP'),
          _buildTile(Icons.person_outline, 'Bilgileri Güncelle', () {
            // Re-use signup flow for editing
            context.pushNamed('nickname');
          }),
          _buildTile(Icons.notifications_outlined, 'Bildirimler', () {
            _showInfo(context, 'Bildirim ayarları yakında eklenecek!');
          }),
          
          const SizedBox(height: 32),
          
          _buildSection('UYGULAMA'),
          _buildTile(Icons.info_outline, 'Hakkımızda', () {
            _showInfo(context, 'Football Challenge v1.0.0\nFutbol tutkunları için geliştirildi.');
          }),
          _buildTile(Icons.privacy_tip_outlined, 'Gizlilik Politikası', () {
            _showInfo(context, 'Gizlilik politikası yakında yayınlanacak.');
          }),
          _buildTile(Icons.help_outline, 'Yardım & Destek', () {
            _showInfo(context, 'Destek için: destek@footballchallenge.app');
          }),
          
          const SizedBox(height: 48),
          
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              icon: const Icon(Icons.logout, size: 18),
              onPressed: () => _showLogoutDialog(context, ref),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.wrong.withOpacity(0.1),
                foregroundColor: AppColors.wrong,
                elevation: 0,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                side: const BorderSide(color: AppColors.wrong, width: 0.5),
              ),
              label: const Text('Oturumu Kapat', style: TextStyle(fontWeight: FontWeight.bold)),
            ),
          ),
          
          const SizedBox(height: 24),
          const Center(
            child: Text(
              '© 2026 Football Challenge\nTüm Hakları Saklıdır.', 
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.white10, fontSize: 10, height: 1.5),
            ),
          ),
        ],
      ),
    );
  }

  void _showLogoutDialog(BuildContext context, WidgetRef ref) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppColors.surface,
        title: const Text('Oturumu Kapat', style: TextStyle(color: Colors.white)),
        content: const Text('Ayrılmak istediğine emin misin?', style: TextStyle(color: Colors.white70)),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('İptal', style: TextStyle(color: AppColors.textSecondary)),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              ref.read(authStateProvider.notifier).logout();
            },
            child: const Text('Evet, Kapat', style: TextStyle(color: AppColors.wrong)),
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
