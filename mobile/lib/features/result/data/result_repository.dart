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

  Future<void> claimAdReward({
    required String sessionId,
  }) async {
    await _dio.post(ApiEndpoints.adReward(sessionId));
  }
}

final resultRepositoryProvider = Provider<ResultRepository>((ref) {
  return ResultRepository(ref.watch(dioProvider));
});
