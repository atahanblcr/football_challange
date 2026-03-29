import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/constants/app_text_styles.dart';
import '../result_provider.dart';
import '../data/result_repository.dart';

class AdRewardButtonWidget extends ConsumerStatefulWidget {
  final String sessionId;

  const AdRewardButtonWidget({super.key, required this.sessionId});

  @override
  ConsumerState<AdRewardButtonWidget> createState() => _AdRewardButtonWidgetState();
}

class _AdRewardButtonWidgetState extends ConsumerState<AdRewardButtonWidget> {
  bool _isLoading = false;

  Future<void> _showAdAndClaim() async {
    setState(() => _isLoading = true);
    
    // TODO: Google Mobile Ads Integration
    // Simulate ad delay
    await Future.delayed(const Duration(seconds: 2));

    try {
      await ref.read(resultRepositoryProvider).claimAdReward(widget.sessionId);
      ref.invalidate(sessionResultProvider(widget.sessionId));
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: const Color(0xFF1A56DB).withOpacity(0.1),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.primary.withOpacity(0.3)),
      ),
      child: Column(
        children: [
          const Text(
            'Puanını 1.5 katına çıkarmak ister misin?',
            style: AppTextStyles.bodyMedium,
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 16),
          ElevatedButton.icon(
            onPressed: _isLoading ? null : _showAdAndClaim,
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.white,
              minimumSize: const Size(double.infinity, 48),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            icon: _isLoading 
                ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                : const Icon(Icons.play_circle_outline),
            label: const Text('Reklam İzle & Puanı Katla!'),
          ),
        ],
      ),
    );
  }
}
