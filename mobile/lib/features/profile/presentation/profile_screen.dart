import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_text_styles.dart';
import '../../../core/router/route_names.dart';
import '../../../shared/providers/auth_provider.dart';
import '../../auth/data/auth_repository.dart';
import '../../auth/domain/user_model.dart';
import 'widgets/stat_card_widget.dart';

final futureMeProvider = FutureProvider<User>((ref) async {
  return ref.watch(authRepositoryProvider).getMe();
});

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final userAsync = ref.watch(futureMeProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            children: [
              // Header
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('PROFİL', style: AppTextStyles.titleLarge),
                  IconButton(
                    icon: const Icon(Icons.settings_outlined, color: AppColors.textSecondary),
                    onPressed: () => context.pushNamed(RouteNames.settings),
                  ),
                ],
              ),

              const SizedBox(height: 32),

              // User Info
              Center(
                child: Column(
                  children: [
                    Container(
                      width: 100,
                      height: 100,
                      decoration: BoxDecoration(
                        color: AppColors.surface,
                        shape: BoxShape.circle,
                        border: Border.all(color: AppColors.primary, width: 2),
                      ),
                      child: const Center(child: Text('👤', style: TextStyle(fontSize: 48))),
                    ).animate().scale(duration: 600.ms, curve: Curves.easeOutBack),
                    const SizedBox(height: 16),
                    Text(userAsync.value?.nickname ?? '...', style: AppTextStyles.titleMedium),
                    const SizedBox(height: 4),
                    Text('🇹🇷 ${_getCountryName(userAsync.value?.countryCode)}', style: AppTextStyles.bodySmall),
                  ],
                ),
              ),

              const SizedBox(height: 40),

              // Stats Grid
              GridView.count(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                crossAxisCount: 2,
                mainAxisSpacing: 16,
                crossAxisSpacing: 16,
                childAspectRatio: 1.5,
                children: [
                  const StatCardWidget(
                    label: 'TOPLAM PUAN',
                    value: '14,250',
                    icon: Icons.emoji_events_outlined,
                    color: AppColors.gold,
                  ).animate().fadeIn(delay: 100.ms).slideX(begin: -0.1, end: 0),
                  const StatCardWidget(
                    label: 'SIRALAMA',
                    value: '#124',
                    icon: Icons.leaderboard_outlined,
                    color: AppColors.primaryLight,
                  ).animate().fadeIn(delay: 200.ms).slideX(begin: 0.1, end: 0),
                  const StatCardWidget(
                    label: 'ÇÖZÜLEN',
                    value: '48',
                    icon: Icons.fact_check_outlined,
                    color: AppColors.correct,
                  ).animate().fadeIn(delay: 300.ms).slideX(begin: -0.1, end: 0),
                  const StatCardWidget(
                    label: 'BAŞARI',
                    value: '%72',
                    icon: Icons.trending_up,
                    color: Colors.purpleAccent,
                  ).animate().fadeIn(delay: 400.ms).slideX(begin: 0.1, end: 0),
                ],
              ),

              const SizedBox(height: 40),

              // Badges Section
              Align(
                alignment: Alignment.centerLeft,
                child: Text('ROZETLER', style: AppTextStyles.labelSmall.copyWith(letterSpacing: 1.5)),
              ),
              const SizedBox(height: 16),
              SizedBox(
                height: 100,
                child: (userAsync.value?.badges.isEmpty ?? true)
                    ? Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: AppColors.surface,
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: const Center(
                          child: Text(
                            'Henüz rozet kazanılmadı. Oynamaya devam et!',
                            style: AppTextStyles.bodySmall,
                            textAlign: TextAlign.center,
                          ),
                        ),
                      )
                    : ListView.separated(
                        scrollDirection: Axis.horizontal,
                        itemCount: userAsync.value!.badges.length,
                        separatorBuilder: (_, __) => const SizedBox(width: 16),
                        itemBuilder: (context, index) {
                          final badge = userAsync.value!.badges[index];
                          return Tooltip(
                            message: badge.description,
                            child: Container(
                              width: 80,
                              decoration: BoxDecoration(
                                color: AppColors.surface,
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(color: AppColors.primary.withOpacity(0.3)),
                              ),
                              child: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Text(badge.icon, style: const TextStyle(fontSize: 32)),
                                  const SizedBox(height: 4),
                                  Text(
                                    badge.name,
                                    style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold),
                                    textAlign: TextAlign.center,
                                  ),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
              ).animate().fadeIn(delay: 500.ms),
            ],
          ),
        ),
      ),
    );
  }

  String _getCountryName(String? code) {
    if (code == 'TR') return 'Türkiye';
    return code ?? 'Bilinmiyor';
  }
}
