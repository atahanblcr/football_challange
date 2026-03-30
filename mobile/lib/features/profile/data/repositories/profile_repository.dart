import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/api_endpoints.dart';
import '../../auth/domain/user_model.dart';

final profileRepositoryProvider = Provider<ProfileRepository>((ref) {
  final dio = ref.watch(apiClientProvider);
  return ProfileRepository(dio);
});

class ProfileRepository {
  final Dio _dio;

  ProfileRepository(this._dio);

  Future<User> getMe() async {
    final response = await _dio.get(ApiEndpoints.me);
    return User.fromJson(response.data);
  }

  Future<User> updateProfile({
    String? nickname,
    int? avatarIndex,
    String? countryCode,
    String? fcmToken,
    bool? pushNotificationsEnabled,
  }) async {
    final Map<String, dynamic> data = {};
    if (nickname != null) data['nickname'] = nickname;
    if (avatarIndex != null) data['avatarIndex'] = avatarIndex;
    if (countryCode != null) data['countryCode'] = countryCode;
    if (fcmToken != null) data['fcmToken'] = fcmToken;
    if (pushNotificationsEnabled != null) {
      data['pushNotificationsEnabled'] = pushNotificationsEnabled;
    }

    final response = await _dio.patch(ApiEndpoints.me, data: data);
    return User.fromJson(response.data);
  }

  Future<void> deleteAccount() async {
    await _dio.delete(ApiEndpoints.me);
  }
}
