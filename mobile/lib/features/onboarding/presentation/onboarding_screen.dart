import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_text_styles.dart';
import '../../../core/router/route_names.dart';
import '../../../core/storage/prefs_storage.dart';

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final PageController _pageController = PageController();
  int _currentPage = 0;

  final List<OnboardingItem> _items = [
    OnboardingItem(
      title: 'Futbol Bilgini Test Et',
      description: 'Her gün yeni sorular, istatistikler ve kategoriler seni bekliyor.',
      icon: '🏆',
    ),
    OnboardingItem(
      title: 'Süreye Karşı Oyna',
      description: 'Zamana karşı yarış, ne kadar çok doğru bilirsen o kadar çok puan al.',
      icon: '⏱️',
    ),
    OnboardingItem(
      title: 'Sıralamada Yüksel',
      description: 'Türkiye ve dünya sıralamalarında zirveye çık.',
      icon: '📊',
    ),
  ];

  Future<void> _completeOnboarding() async {
    await PrefsStorage.setOnboardingCompleted();
    if (mounted) {
      context.go(RouteNames.login);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Column(
          children: [
            // Üst kısım (Sayfa Sayacı)
            Padding(
              padding: const EdgeInsets.all(24.0),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  Text(
                    '${_currentPage + 1}/3',
                    style: AppTextStyles.bodySmall,
                  ),
                ],
              ),
            ),
            
            // Orta kısım (PageView)
            Expanded(
              child: PageView.builder(
                controller: _pageController,
                onPageChanged: (index) => setState(() => _currentPage = index),
                itemCount: _items.length,
                itemBuilder: (context, index) {
                  final item = _items[index];
                  return Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 40.0),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          item.icon,
                          style: const TextStyle(fontSize: 100),
                        ).animate().scale(duration: 600.ms, curve: Curves.easeOutBack),
                        const SizedBox(height: 48),
                        Text(
                          item.title,
                          textAlign: TextAlign.center,
                          style: AppTextStyles.titleLarge,
                        ).animate().fadeIn(delay: 200.ms).slideY(begin: 0.2, end: 0),
                        const SizedBox(height: 16),
                        Text(
                          item.description,
                          textAlign: TextAlign.center,
                          style: AppTextStyles.bodyLarge.copyWith(
                            color: AppColors.textSecondary,
                            height: 1.5,
                          ),
                        ).animate().fadeIn(delay: 400.ms).slideY(begin: 0.2, end: 0),
                      ],
                    ),
                  );
                },
              ),
            ),
            
            // Alt kısım (Butonlar & İndikatörler)
            Padding(
              padding: const EdgeInsets.all(40.0),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  // İndikatörler
                  Row(
                    children: List.generate(3, (index) => 
                      AnimatedContainer(
                        duration: 300.ms,
                        width: index == _currentPage ? 24 : 8,
                        height: 8,
                        margin: const EdgeInsets.only(right: 6),
                        decoration: BoxDecoration(
                          color: index == _currentPage ? AppColors.primary : AppColors.surfaceVariant,
                          borderRadius: BorderRadius.circular(4),
                        ),
                      ),
                    ),
                  ),
                  
                  // Buton
                  ElevatedButton(
                    onPressed: () {
                      if (_currentPage < 2) {
                        _pageController.nextPage(
                          duration: const Duration(milliseconds: 300),
                          curve: Curves.easeInOut,
                        );
                      } else {
                        _completeOnboarding();
                      }
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      minimumSize: const Size(120, 52),
                    ),
                    child: Text(_currentPage < 2 ? 'İleri →' : 'Başla 🎯'),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class OnboardingItem {
  final String title;
  final String description;
  final String icon;

  OnboardingItem({required this.title, required this.description, required this.icon});
}
