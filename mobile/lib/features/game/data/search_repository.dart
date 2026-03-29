import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_endpoints.dart';
import '../../../core/network/dio_client.dart';
import '../../../core/errors/app_exception.dart';
import '../domain/search_result_model.dart';

final searchRepositoryProvider = Provider<SearchRepository>((ref) {
  return SearchRepository(ref.watch(dioProvider));
});

class SearchRepository {
  final Dio _dio;
  SearchRepository(this._dio);

  Future<List<SearchResult>> search({
    required String query,
    required String entityType,
  }) async {
    try {
      final response = await _dio.get(
        ApiEndpoints.search,
        queryParameters: {'q': query, 'type': entityType},
      );
      final List data = response.data['data'];
      return data.map((e) => SearchResult.fromJson(e)).toList();
    } on DioException catch (e) {
      throw AppException.fromDioError(e);
    }
  }
}
