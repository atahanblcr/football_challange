import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_mobile_ads/google_mobile_ads.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/constants/app_text_styles.dart';
import '../../../../core/services/ad_service.dart';
import '../result_provider.dart';
import '../../data/result_repository.dart';

class AdRewardButtonWidget extends ConsumerStatefulWidget {
  final String sessionId;

  const AdRewardButtonWidget({super.key, required this.sessionId});

  @override
  ConsumerState<AdRewardButtonWidget> createState() => _AdRewardButtonWidgetState();
}

class _AdRewardButtonWidgetState extends ConsumerState<AdRewardButtonWidget> {
  bool _isLoading = false;
  RewardedAd? _rewardedAd;

  @override
  void dispose() {
    _rewardedAd?.dispose();
    super.dispose();
  }

  void _showAdAndClaim() {
    setState(() => _isLoading = true);
    
    AdService.loadRewardedAd(
      onAdLoaded: (ad) {
        _rewardedAd = ad;
        _rewardedAd!.fullScreenContentCallback = FullScreenContentCallback(
          onAdDismissedFullScreenContent: (ad) {
            ad.dispose();
            _rewardedAd = null;
            if (mounted) setState(() => _isLoading = false);
          },
          onAdFailedToShowFullScreenContent: (ad, error) {
            ad.dispose();
            _rewardedAd = null;
            if (mounted) setState(() => _isLoading = false);
          },
        );

        _rewardedAd!.show(
          onUserEarnedReward: (AdWithoutView ad, RewardItem reward) async {
            // Reward earned!
            try {
              // Note: Google's SSV reward verification happens server-to-server.
              // Here we just notify the backend that the user finished the ad.
              // For extra security, Google's SSV callback can be used on the backend.
              
              await ref.read(resultRepositoryProvider).claimAdReward(
                sessionId: widget.sessionId,
              );

              if (mounted) {
                ref.invalidate(sessionResultProvider(widget.sessionId));
              }
            } catch (e) {
              if (mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text('Hata: ${e.toString()}'))
                );
              }
            }
          },
        );
      },
      onAdFailedToLoad: (error) {
        if (mounted) {
          setState(() => _isLoading = false);
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Reklam yüklenemedi. Lütfen tekrar deneyin.'))
          );
        }
      },
    );
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
