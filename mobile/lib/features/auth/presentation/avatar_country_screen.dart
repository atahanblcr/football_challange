import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_text_styles.dart';
import '../../../core/router/route_names.dart';
import '../../../shared/widgets/primary_button_widget.dart';
import '../../../shared/providers/auth_provider.dart';

class AvatarCountryScreen extends ConsumerStatefulWidget {
  const AvatarCountryScreen({super.key});

  @override
  ConsumerState<AvatarCountryScreen> createState() => _AvatarCountryScreenState();
}

class _AvatarCountryScreenState extends ConsumerState<AvatarCountryScreen> {
  int _selectedAvatar = 0;
  String _selectedCountry = 'TR';
  bool _isLoading = false;

  final List<String> _avatars = [
    '⚽', '🏆', '🏟️', '🏃', '🥅', '👟', '👕', '🧤', '📢', '📺'
  ];

  Future<void> _onComplete() async {
    setState(() => _isLoading = true);
    try {
      final nickname = ref.read(signupNicknameProvider);
      await ref.read(authStateProvider.notifier).completeProfile(
        nickname: nickname,
        avatarIndex: _selectedAvatar,
        countryCode: _selectedCountry,
      );
      if (mounted) {
        context.go(RouteNames.home);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString()), backgroundColor: AppColors.wrong),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(32.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Profilini Tamamla', style: AppTextStyles.titleLarge),
              const SizedBox(height: 32),
              
              const Text('Avatar Seç', style: AppTextStyles.titleSmall),
              const SizedBox(height: 16),
              SizedBox(
                height: 100,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  itemCount: _avatars.length,
                  separatorBuilder: (_, __) => const SizedBox(width: 12),
                  itemBuilder: (context, index) {
                    return GestureDetector(
                      onTap: () => setState(() => _selectedAvatar = index),
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 200),
                        width: 80,
                        decoration: BoxDecoration(
                          color: _selectedAvatar == index ? AppColors.primary.withOpacity(0.2) : AppColors.surface,
                          shape: BoxShape.circle,
                          border: Border.all(
                            color: _selectedAvatar == index ? AppColors.primary : Colors.transparent,
                            width: 3,
                          ),
                        ),
                        child: Center(child: Text(_avatars[index], style: const TextStyle(fontSize: 32))),
                      ),
                    );
                  },
                ),
              ),
              
              const SizedBox(height: 48),
              
              const Text('Ülke', style: AppTextStyles.titleSmall),
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.surfaceVariant),
                ),
                child: Row(
                  children: [
                    const Text('🇹🇷', style: TextStyle(fontSize: 24)),
                    const SizedBox(width: 12),
                    const Text('Türkiye', style: AppTextStyles.bodyLarge),
                    const Spacer(),
                    const Icon(Icons.check, color: AppColors.correct),
                  ],
                ),
              ),
              
              const Spacer(),
              PrimaryButton(
                label: 'Kaydı Tamamla',
                isLoading: _isLoading,
                onPressed: _onComplete,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
