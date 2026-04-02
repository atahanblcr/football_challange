import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/constants/app_text_styles.dart';
import '../../../app_config/presentation/app_config_provider.dart';

class ResetCountdownWidget extends ConsumerStatefulWidget {
  const ResetCountdownWidget({super.key});

  @override
  ConsumerState<ResetCountdownWidget> createState() => _ResetCountdownWidgetState();
}

class _ResetCountdownWidgetState extends ConsumerState<ResetCountdownWidget> {
  Timer? _timer;
  Duration _remaining = Duration.zero;

  @override
  void initState() {
    super.initState();
    _startTimer();
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  void _startTimer() {
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      final configAsync = ref.read(appConfigProvider);
      configAsync.whenData((config) {
        final now = DateTime.now().toUtc().add(const Duration(hours: 3)); // UTC+3 Mock
        // Actually, we should use the server_time from config + elapsed local time
        // But for MVP, nextResetAt - now (local adjusted) is fine if server sync is good.
        
        final remaining = config.nextResetAt.difference(DateTime.now());
        
        if (remaining.isNegative) {
          if (mounted) {
            setState(() => _remaining = Duration.zero);
            // Refresh daily questions if reset happened
            ref.invalidate(appConfigProvider);
          }
        } else {
          if (mounted) {
            setState(() => _remaining = remaining);
          }
        }
      });
    });
  }

  String _formatDuration(Duration d) {
    String twoDigits(int n) => n.toString().padLeft(2, "0");
    String twoDigitMinutes = twoDigits(d.inMinutes.remainder(60));
    String twoDigitSeconds = twoDigits(d.inSeconds.remainder(60));
    return "${twoDigits(d.inHours)}:$twoDigitMinutes:$twoDigitSeconds";
  }

  @override
  Widget build(BuildContext context) {
    if (_remaining == Duration.zero) return const SizedBox.shrink();

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: AppColors.primary.withOpacity(0.1),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.primary.withOpacity(0.3)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.timer_outlined, size: 14, color: AppColors.primaryLight),
          const SizedBox(width: 6),
          Text(
            'Yenilenmeye: ${_formatDuration(_remaining)}',
            style: AppTextStyles.bodySmall.copyWith(
              color: AppColors.primaryLight,
              fontWeight: FontWeight.bold,
              fontSize: 11,
            ),
          ),
        ],
      ),
    );
  }
}
