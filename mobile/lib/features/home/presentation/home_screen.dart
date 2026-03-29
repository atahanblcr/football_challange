import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_text_styles.dart';
import '../../../core/router/route_names.dart';
import '../../../shared/widgets/error_screen_widget.dart';
import '../../../shared/widgets/loading_widget.dart';
import '../../auth/data/auth_repository.dart';
import 'home_provider.dart';
import 'widgets/module_card_widget.dart';
import 'widgets/special_event_banner_widget.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final questionsAsync = ref.watch(dailyQuestionsProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: questionsAsync.when(
          loading: () => const LoadingWidget(),
          error: (err, _) => ErrorScreenWidget(
            message: err.toString(),
            onRetry: () => ref.invalidate(dailyQuestionsProvider),
          ),
          data: (questions) => _buildContent(context, ref, questions),
        ),
      ),
    );
  }

  Widget _buildContent(BuildContext context, WidgetRef ref, List<dynamic> questions) {
    return RefreshIndicator(
      onRefresh: () async => ref.invalidate(dailyQuestionsProvider),
      child: CustomScrollView(
        slivers: [
          // Header
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('Günaydın, 👋', style: AppTextStyles.bodySmall),
                          Consumer(
                            builder: (context, ref, _) {
                              return FutureBuilder<String>(
                                future: ref.read(authRepositoryProvider).getMe().then((u) => u.nickname),
                                builder: (context, snapshot) => Text(
                                  snapshot.data ?? '...',
                                  style: AppTextStyles.titleMedium,
                                ),
                              );
                            },
                          ),
                        ],
                      ),

                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: AppColors.surface,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Icon(Icons.notifications_none, color: AppColors.textSecondary),
                      ),
                    ],
                  ),
                  const SizedBox(height: 32),
                  const SpecialEventBannerWidget().animate().fadeIn().slideX(begin: -0.1, end: 0),
                ],
              ),
            ),
          ),

          // Title
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24.0),
              child: Text(
                'Günün Challenge\'ları',
                style: AppTextStyles.titleSmall.copyWith(letterSpacing: 0.5),
              ),
            ),
          ),

          if (questions.isEmpty)
            const SliverFillRemaining(
              child: Center(
                child: Text(
                  'Henüz soru atanmamış!\nLütfen daha sonra tekrar deneyin.',
                  textAlign: TextAlign.center,
                  style: AppTextStyles.bodyMedium,
                ),
              ),
            )
          else
            // Grid
            SliverPadding(
            padding: const EdgeInsets.all(24),
            sliver: SliverGrid(
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                mainAxisSpacing: 16,
                crossAxisSpacing: 16,
                childAspectRatio: 0.85,
              ),
              delegate: SliverChildBuilderDelegate(
                (context, index) {
                  final q = questions[index];
                  return ModuleCardWidget(
                    question: q,
                    onTap: () => context.pushNamed(
                      RouteNames.challengeIntro,
                      pathParameters: {'questionId': q.id},
                      queryParameters: {
                        'module': q.module,
                        'difficulty': q.difficulty,
                        'answerCount': q.answerCount.toString(),
                        'timeLimit': q.timeLimit.toString(),
                      },
                    ),
                  ).animate().fadeIn(delay: (index * 100).ms).scale(begin: const Offset(0.9, 0.9));
                },
                childCount: questions.length,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
