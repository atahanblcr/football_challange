import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_endpoints.dart';
import '../../../core/network/dio_client.dart';
import '../../../core/errors/app_exception.dart';
import '../domain/leaderboard_model.dart';

final leaderboardRepositoryProvider = Provider<LeaderboardRepository>((ref) {
  return LeaderboardRepository(ref.watch(dioProvider));
});

class LeaderboardRepository {
  final Dio _dio;
  LeaderboardRepository(this._dio);

  Future<LeaderboardResponse> getLeaderboard({
    required String scope,
    required String period,
    String? module,
  }) async {
    try {
      final response = await _dio.get(
        ApiEndpoints.leaderboard,
        queryParameters: {
          'scope': scope,
          'period': period,
          if (module != null) 'module': module,
        },
      );
      return LeaderboardResponse.fromJson(response.data['data']);
    } on DioException catch (e) {
      throw AppException.fromDioError(e);
    }
  }
}
