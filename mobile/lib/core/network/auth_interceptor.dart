import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../storage/secure_storage.dart';
import 'api_endpoints.dart';

class AuthInterceptor extends Interceptor {
  final Ref _ref;
  bool _isRefreshing = false;
  final List<Map<String, dynamic>> _failedRequestsQueue = [];

  AuthInterceptor(this._ref);

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) async {
    final token = await SecureStorageService.getAccessToken();
    if (token != null) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    handler.next(options);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) async {
    if (err.response?.statusCode == 401) {
      if (_isRefreshing) {
        // Queue the request
        _failedRequestsQueue.add({
          'options': err.requestOptions,
          'handler': handler,
        });
        return;
      }

      _isRefreshing = true;
      try {
        final newToken = await _refreshToken();
        if (newToken != null) {
          // Retry the current request
          err.requestOptions.headers['Authorization'] = 'Bearer $newToken';
          final response = await Dio().fetch(err.requestOptions);
          
          // Retry queued requests
          for (final req in _failedRequestsQueue) {
            final options = req['options'] as RequestOptions;
            final qHandler = req['handler'] as ErrorInterceptorHandler;
            options.headers['Authorization'] = 'Bearer $newToken';
            final qResponse = await Dio().fetch(options);
            qHandler.resolve(qResponse);
          }
          _failedRequestsQueue.clear();
          
          handler.resolve(response);
          return;
        }
      } catch (_) {
        _failedRequestsQueue.clear();
        await _ref.read(secureStorageProvider).clearAll();
        // Redirect to login if needed (handled by auth provider/router)
      } finally {
        _isRefreshing = false;
      }
    }
    handler.next(err);
  }

  Future<String?> _refreshToken() async {
    final refreshToken = await SecureStorageService.getRefreshToken();
    if (refreshToken == null) return null;

    try {
      final response = await Dio().post(
        '${ApiEndpoints.baseUrl}${ApiEndpoints.tokenRefresh}',
        data: {'refreshToken': refreshToken},
      );

      final newAccessToken = response.data['data']['accessToken'] as String;
      final newRefreshToken = response.data['data']['refreshToken'] as String;

      await SecureStorageService.saveTokens(
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      );

      return newAccessToken;
    } catch (_) {
      return null;
    }
  }
}
