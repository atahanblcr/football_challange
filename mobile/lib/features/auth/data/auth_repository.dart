import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_endpoints.dart';
import '../../../core/network/dio_client.dart';
import '../../../core/errors/app_exception.dart';
import '../domain/user_model.dart';

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepository(ref.watch(dioProvider));
});

class AuthResponse {
  final String accessToken;
  final String refreshToken;
  final String userId;
  final bool isNewUser;

  AuthResponse({
    required this.accessToken,
    required this.refreshToken,
    required this.userId,
    required this.isNewUser,
  });

  factory AuthResponse.fromJson(Map<String, dynamic> json) {
    return AuthResponse(
      accessToken: json['accessToken'] as String,
      refreshToken: json['refreshToken'] as String,
      userId: json['user']['id'] as String,
      isNewUser: json['isNewUser'] as bool? ?? false,
    );
  }
}

class AuthRepository {
  final Dio _dio;

  AuthRepository(this._dio);

  Future<User> getMe() async {
    try {
      final response = await _dio.get(ApiEndpoints.me);
      return User.fromJson(response.data['data']);
    } on DioException catch (e) {
      throw AppException.fromDioError(e);
    }
  }

  Future<AuthResponse> loginWithEmail(String email, String password) async {
    try {
      final response = await _dio.post(
        ApiEndpoints.emailLogin,
        data: {'email': email, 'password': password},
      );
      return AuthResponse.fromJson(response.data['data']);
    } on DioException catch (e) {
      throw AppException.fromDioError(e);
    }
  }

  Future<AuthResponse> registerWithEmail(String email, String password) async {
    try {
      final response = await _dio.post(
        ApiEndpoints.emailRegister,
        data: {'email': email, 'password': password},
      );
      return AuthResponse.fromJson(response.data['data']);
    } on DioException catch (e) {
      throw AppException.fromDioError(e);
    }
  }

  Future<AuthResponse> loginWithGoogle(String idToken) async {
    try {
      final response = await _dio.post(
        ApiEndpoints.googleLogin,
        data: {'idToken': idToken},
      );
      return AuthResponse.fromJson(response.data['data']);
    } on DioException catch (e) {
      throw AppException.fromDioError(e);
    }
  }

  Future<void> logout() async {
    try {
      await _dio.delete(ApiEndpoints.logout);
    } on DioException catch (e) {
      throw AppException.fromDioError(e);
    }
  }

  Future<bool> checkNickname(String nickname) async {
    try {
      final response = await _dio.get(ApiEndpoints.checkNickname(nickname));
      return response.data['data']['available'] as bool;
    } on DioException catch (e) {
      throw AppException.fromDioError(e);
    }
  }

  Future<void> completeProfile({
    required String nickname,
    required int avatarIndex,
    required String countryCode,
  }) async {
    try {
      await _dio.patch(
        ApiEndpoints.me,
        data: {
          'nickname': nickname,
          'avatarIndex': avatarIndex,
          'countryCode': countryCode,
        },
      );
    } on DioException catch (e) {
      throw AppException.fromDioError(e);
    }
  }
}
