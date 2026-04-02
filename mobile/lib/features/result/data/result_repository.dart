import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import '../../../core/network/dio_client.dart';
import '../../../core/network/api_endpoints.dart';
import '../domain/result_model.dart';

class ResultRepository {
  final Dio _dio;

  ResultRepository(this._dio);

  Future<SessionResult> getResult(String sessionId) async {
    final response = await _dio.get(ApiEndpoints.sessionResult(sessionId));
    return SessionResult.fromJson(response.data['data']);
  }

  Future<String> getAdIntent(String sessionId) async {
    final response = await _dio.post(ApiEndpoints.adIntent(sessionId));
    return response.data['data']['adToken'];
  }

  Future<SessionResult> claimAdReward({
    required String sessionId,
    required String adToken,
  }) async {
    final response = await _dio.post(
      ApiEndpoints.adReward(sessionId),
      data: {'adToken': adToken},
    );
    return SessionResult.fromJson(response.data['data']);
  }
}

final resultRepositoryProvider = Provider<ResultRepository>((ref) {
  return ResultRepository(ref.watch(dioProvider));
});
