import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_endpoints.dart';
import '../../../core/network/dio_client.dart';
import '../../../core/errors/app_exception.dart';
import '../domain/result_model.dart';

final resultRepositoryProvider = Provider<ResultRepository>((ref) {
  return ResultRepository(ref.watch(dioProvider));
});

class ResultRepository {
  final Dio _dio;
  ResultRepository(this._dio);

  Future<SessionResult> getResult(String sessionId) async {
    try {
      final response = await _dio.get(ApiEndpoints.sessionResult(sessionId));
      return SessionResult.fromJson(response.data['data']);
    } on DioException catch (e) {
      throw AppException.fromDioError(e);
    }
  }

  Future<SessionResult> claimAdReward(String sessionId) async {
    try {
      final response = await _dio.post(ApiEndpoints.adReward(sessionId));
      return SessionResult.fromJson(response.data['data']);
    } on DioException catch (e) {
      throw AppException.fromDioError(e);
    }
  }
}
