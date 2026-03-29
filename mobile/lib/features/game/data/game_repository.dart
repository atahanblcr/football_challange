import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_endpoints.dart';
import '../../../core/network/dio_client.dart';
import '../../../core/errors/app_exception.dart';
import '../domain/game_session_model.dart';

final gameRepositoryProvider = Provider<GameRepository>((ref) {
  return GameRepository(ref.watch(dioProvider));
});

class GameRepository {
  final Dio _dio;
  GameRepository(this._dio);

  Future<GameSession> startQuestion(String questionId) async {
    try {
      final response = await _dio.post(ApiEndpoints.startQuestion(questionId));
      return GameSession.fromJson(response.data['data']);
    } on DioException catch (e) {
      throw AppException.fromDioError(e);
    }
  }

  Future<void> submitSession({
    required String sessionId,
    required List<String> entityIds,
  }) async {
    try {
      await _dio.post(
        ApiEndpoints.submitSession(sessionId),
        data: {'entityIds': entityIds},
      );
    } on DioException catch (e) {
      throw AppException.fromDioError(e);
    }
  }
}
