import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_endpoints.dart';
import '../../../core/network/dio_client.dart';
import '../../../core/errors/app_exception.dart';
import '../domain/app_config_model.dart';

final appConfigRepositoryProvider = Provider<AppConfigRepository>((ref) {
  return AppConfigRepository(ref.watch(dioProvider));
});

class AppConfigRepository {
  final Dio _dio;

  AppConfigRepository(this._dio);

  Future<AppConfig> getConfig() async {
    try {
      final response = await _dio.get(ApiEndpoints.appConfig);
      return AppConfig.fromJson(response.data['data']);
    } on DioException catch (e) {
      throw AppException.fromDioError(e);
    }
  }
}
