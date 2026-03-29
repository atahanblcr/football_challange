import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/constants/app_text_styles.dart';

class TimerWidget extends StatefulWidget {
  final DateTime startedAt;
  final int timeLimitSeconds;
  final VoidCallback onExpired;

  const TimerWidget({
    super.key,
    required this.startedAt,
    required this.timeLimitSeconds,
    required this.onExpired,
  });

  @override
  State<TimerWidget> createState() => _TimerWidgetState();
}

class _TimerWidgetState extends State<TimerWidget>
    with SingleTickerProviderStateMixin {
  late Timer _ticker;
  late AnimationController _pulseController;
  int _remainingSeconds = 0;
  bool _expired = false;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 500),
    )..repeat(reverse: true);

    _updateRemaining();
    _ticker = Timer.periodic(const Duration(seconds: 1), (_) => _updateRemaining());
  }

  void _updateRemaining() {
    if (_expired) return;

    final elapsed = DateTime.now().difference(widget.startedAt).inSeconds;
    final remaining = widget.timeLimitSeconds - elapsed;

    if (remaining <= 0) {
      if (!_expired) {
        _expired = true;
        _ticker.cancel();
        HapticFeedback.vibrate();
        widget.onExpired();
      }
      setState(() => _remainingSeconds = 0);
      return;
    }

    if (remaining == 10) HapticFeedback.mediumImpact();
    else if (remaining <= 3) HapticFeedback.heavyImpact();

    setState(() => _remainingSeconds = remaining);
  }

  @override
  void dispose() {
    _ticker.cancel();
    _pulseController.dispose();
    super.dispose();
  }

  Color get _timerColor {
    if (_remainingSeconds <= 3) return AppColors.wrong;
    if (_remainingSeconds <= 10) return AppColors.warning;
    return AppColors.primary;
  }

  @override
  Widget build(BuildContext context) {
    final isCritical = _remainingSeconds <= 3 && !_expired;

    return Column(
      children: [
        AnimatedBuilder(
          animation: _pulseController,
          builder: (context, child) {
            return Opacity(
              opacity: isCritical ? 0.5 + (_pulseController.value * 0.5) : 1.0,
              child: Text(
                _formatTime(_remainingSeconds),
                style: AppTextStyles.timerText.copyWith(color: _timerColor),
              ),
            );
          },
        ),
        const SizedBox(height: 8),
        LinearProgressIndicator(
          value: _remainingSeconds / widget.timeLimitSeconds,
          backgroundColor: AppColors.surfaceVariant,
          valueColor: AlwaysStoppedAnimation(_timerColor),
        ),
      ],
    );
  }

  String _formatTime(int seconds) {
    if (seconds <= 0) return '0:00';
    final m = seconds ~/ 60;
    final s = seconds % 60;
    return '$m:${s.toString().padLeft(2, '0')}';
  }
}
