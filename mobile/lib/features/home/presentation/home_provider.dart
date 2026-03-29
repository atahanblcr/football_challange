import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/home_repository.dart';
import '../domain/daily_question_model.dart';

final dailyQuestionsProvider = FutureProvider<List<DailyQuestion>>((ref) async {
  return ref.watch(homeRepositoryProvider).getDailyQuestions();
});
