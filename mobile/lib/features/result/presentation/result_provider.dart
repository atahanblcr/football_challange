import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/result_repository.dart';
import '../domain/result_model.dart';

final sessionResultProvider = FutureProvider.family<SessionResult, String>((ref, sessionId) async {
  return ref.watch(resultRepositoryProvider).getResult(sessionId);
});
