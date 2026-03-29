import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_endpoints.dart';
import '../../../core/network/dio_client.dart';
import '../../../core/errors/app_exception.dart';
import '../domain/daily_question_model.dart';

final homeRepositoryProvider = Provider<HomeRepository>((ref) {
  return HomeRepository(ref.watch(dioProvider));
});

class HomeRepository {
  final Dio _dio;

  HomeRepository(this._dio);

  Future<List<DailyQuestion>> getDailyQuestions() async {
    try {
      final response = await _dio.get(ApiEndpoints.dailyQuestions);
      final List data = response.data['data'];
      return data.map((e) => DailyQuestion.fromJson(e)).toList();
    } on DioException catch (e) {
      throw AppException.fromDioError(e);
    }
  }
}
