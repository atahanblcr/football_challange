import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_text_styles.dart';
import '../../../shared/widgets/error_screen_widget.dart';
import '../../../shared/widgets/loading_widget.dart';
import 'leaderboard_provider.dart';
import 'widgets/leaderboard_tile_widget.dart';

class LeaderboardScreen extends ConsumerWidget {
  const LeaderboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final leaderboardAsync = ref.watch(leaderboardProvider);
    final scope = ref.watch(leaderboardScopeProvider);
    final period = ref.watch(leaderboardPeriodProvider);
    final module = ref.watch(leaderboardModuleProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Column(
          children: [
            // Header
            Padding(
              padding: const EdgeInsets.all(24.0),
              child: Row(
                children: [
                  const Text('📊', style: TextStyle(fontSize: 32)),
                  const SizedBox(width: 12),
                  const Text('SIRALAMA', style: AppTextStyles.titleLarge),
                ],
              ),
            ),

            // Scope Selector (Global / TR)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: Container(
                padding: const EdgeInsets.all(4),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  children: [
                    _buildTab(ref, 'Global', 'global', scope == 'global'),
                    _buildTab(ref, 'Türkiye', 'tr', scope == 'tr'),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 12),

            // Module Selector
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: Row(
                children: [
                  _buildModuleChip(ref, 'Hepsi', null, module == null),
                  _buildModuleChip(ref, 'Oyuncular', 'players', module == 'players'),
                  _buildModuleChip(ref, 'Kulüpler', 'clubs', module == 'clubs'),
                  _buildModuleChip(ref, 'Milli Takım', 'nationals', module == 'nationals'),
                  _buildModuleChip(ref, 'Teknik Direktör', 'managers', module == 'managers'),
                ],
              ),
            ),

            const SizedBox(height: 12),

            // Period Selector
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: Row(
                children: [
                  _buildChip(ref, 'Haftalık', 'weekly', period == 'weekly'),
                  _buildChip(ref, 'Aylık', 'monthly', period == 'monthly'),
                  _buildChip(ref, 'Tüm Zamanlar', 'alltime', period == 'alltime'),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // List
            Expanded(
              child: leaderboardAsync.when(
                loading: () => const LoadingWidget(),
                error: (err, _) => ErrorScreenWidget(onRetry: () => ref.invalidate(leaderboardProvider)),
                data: (data) => _buildList(data),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTab(WidgetRef ref, String label, String value, bool isSelected) {
    return Expanded(
      child: GestureDetector(
        onTap: () => ref.read(leaderboardScopeProvider.notifier).state = value,
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 10),
          decoration: BoxDecoration(
            color: isSelected ? AppColors.primary : Colors.transparent,
            borderRadius: BorderRadius.circular(8),
          ),
          child: Text(
            label,
            textAlign: TextAlign.center,
            style: TextStyle(
              color: isSelected ? Colors.white : AppColors.textSecondary,
              fontWeight: FontWeight.bold,
              fontSize: 13,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildModuleChip(WidgetRef ref, String label, String? value, bool isSelected) {
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: ChoiceChip(
        label: Text(label),
        selected: isSelected,
        onSelected: (_) => ref.read(leaderboardModuleProvider.notifier).state = value,
        selectedColor: AppColors.primaryLight.withOpacity(0.2),
        labelStyle: TextStyle(
          color: isSelected ? AppColors.primaryLight : AppColors.textSecondary,
          fontSize: 12,
          fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
        ),
        backgroundColor: Colors.transparent,
        side: BorderSide(color: isSelected ? AppColors.primaryLight : AppColors.surfaceVariant),
      ),
    );
  }

  Widget _buildChip(WidgetRef ref, String label, String value, bool isSelected) {
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: ChoiceChip(
        label: Text(label),
        selected: isSelected,
        onSelected: (_) => ref.read(leaderboardPeriodProvider.notifier).state = value,
        selectedColor: AppColors.primary.withOpacity(0.2),
        labelStyle: TextStyle(
          color: isSelected ? AppColors.primaryLight : AppColors.textSecondary,
          fontSize: 12,
          fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
        ),
        backgroundColor: Colors.transparent,
        side: BorderSide(color: isSelected ? AppColors.primaryLight : AppColors.surfaceVariant),
      ),
    );
  }

  Widget _buildList(dynamic data) {
    return ListView.builder(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      itemCount: data.items.length,
      itemBuilder: (context, index) {
        final entry = data.items[index];
        return LeaderboardTileWidget(
          entry: entry,
          isMe: entry.userId == 'EF123', // TODO: Get actual my ID
        ).animate().fadeIn(delay: (index * 50).ms).slideY(begin: 0.1, end: 0);
      },
    );
  }
}
