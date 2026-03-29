import 'package:dio/dio.dart';

class AppException implements Exception {
  final String code;
  final String message;
  final int? statusCode;

  const AppException({
    required this.code,
    required this.message,
    this.statusCode,
  });

  factory AppException.fromDioError(DioException e) {
    final data = e.response?.data;
    final errorObj = data is Map ? data['error'] : null;

    return AppException(
      code: errorObj?['code'] as String? ?? 'UNKNOWN',
      message: errorObj?['message'] as String? ?? 'Beklenmedik bir hata oluştu',
      statusCode: e.response?.statusCode,
    );
  }

  bool get isUnauthorized => statusCode == 401;
  bool get isBanned => code == 'ACCOUNT_BANNED';
  bool get isSessionExists => code == 'SESSION_ALREADY_EXISTS';

  @override
  String toString() => 'AppException($code): $message';
}
