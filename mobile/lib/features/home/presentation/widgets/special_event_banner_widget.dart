import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/constants/app_text_styles.dart';
import '../../../../core/router/route_names.dart';
import '../../domain/daily_question_model.dart';

class SpecialEventBannerWidget extends StatelessWidget {
  final DailyQuestion question;

  const SpecialEventBannerWidget({
    super.key,
    required this.question,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFFD4AF37), Color(0xFFB8860B)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFFD4AF37).withOpacity(0.3),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Text('🌍', style: TextStyle(fontSize: 32)),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'DÜNYA KUPASI 2026',
                      style: AppTextStyles.titleMedium.copyWith(color: Colors.black, letterSpacing: 1),
                    ),
                    const Text(
                      'Özel etkinlik soruları yayında!',
                      style: TextStyle(color: Colors.black87, fontSize: 13, fontWeight: FontWeight.w500),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          ElevatedButton(
            onPressed: () => context.pushNamed(
              RouteNames.challengeIntro,
              pathParameters: {'questionId': question.id},
              queryParameters: {
                'module': question.module,
                'difficulty': question.difficulty,
                'answerCount': question.answerCount.toString(),
                'timeLimit': question.timeLimit.toString(),
              },
            ),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.black,
              foregroundColor: Colors.white,
              minimumSize: const Size(double.infinity, 44),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            child: Text(question.isCompleted ? 'Sonuçları Gör' : 'Hemen Oyna'),
          ),
        ],
      ),
    );
  }
}
