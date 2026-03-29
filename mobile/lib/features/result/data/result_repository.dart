import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import '../../../core/network/dio_client.dart';
import '../domain/result_model.dart';

class ResultRepository {
  final Dio _dio;

  ResultRepository(this._dio);

  Future<void> claimAdReward(String sessionId) async {
    await _dio.post('/api/v1/sessions/$sessionId/ad-reward');
  }

  Future<SessionResult> getResult(String sessionId) async {
    final response = await _dio.get('/api/v1/sessions/$sessionId/result');
    return SessionResult.fromJson(response.data);
  }

  // Gerekirse başka result-related metodlar eklenebilir
}

final resultRepositoryProvider = Provider<ResultRepository>((ref) {
  return ResultRepository(ref.watch(dioProvider));
});
