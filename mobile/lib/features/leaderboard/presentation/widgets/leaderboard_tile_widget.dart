import 'package:flutter/material.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/constants/app_text_styles.dart';
import '../../domain/leaderboard_model.dart';

class LeaderboardTileWidget extends StatelessWidget {
  final LeaderboardEntry entry;
  final bool isMe;

  const LeaderboardTileWidget({
    super.key,
    required this.entry,
    this.isMe = false,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isMe ? AppColors.primary.withOpacity(0.15) : AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isMe ? AppColors.primary.withOpacity(0.5) : AppColors.surfaceVariant,
          width: isMe ? 2 : 1,
        ),
      ),
      child: Row(
        children: [
          _buildRankBadge(entry.rank),
          const SizedBox(width: 16),
          _buildAvatar(entry.avatarIndex),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  entry.nickname,
                  style: AppTextStyles.bodyLarge.copyWith(fontWeight: FontWeight.bold),
                ),
                if (entry.countryCode != null)
                  Text(_flagEmoji(entry.countryCode!), style: const TextStyle(fontSize: 12)),
              ],
            ),
          ),
          Text(
            '${entry.score}',
            style: AppTextStyles.titleSmall.copyWith(color: AppColors.primaryLight),
          ),
        ],
      ),
    );
  }

  Widget _buildRankBadge(int rank) {
    Color color = AppColors.textSecondary;
    if (rank == 1) color = AppColors.gold;
    else if (rank == 2) color = AppColors.silver;
    else if (rank == 3) color = AppColors.bronze;

    return Container(
      width: 28,
      alignment: Alignment.center,
      child: Text(
        '$rank',
        style: TextStyle(
          color: color,
          fontWeight: FontWeight.bold,
          fontSize: rank <= 3 ? 18 : 14,
        ),
      ),
    );
  }

  Widget _buildAvatar(String? index) {
    return Container(
      width: 40,
      height: 40,
      decoration: const BoxDecoration(
        color: AppColors.surfaceVariant,
        shape: BoxShape.circle,
      ),
      child: const Center(child: Text('👤', style: TextStyle(fontSize: 20))),
    );
  }

  String _flagEmoji(String code) {
    return code.toUpperCase().runes.map((r) => String.fromCharCode(r + 127397)).join();
  }
}
