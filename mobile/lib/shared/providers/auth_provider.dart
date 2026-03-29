import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/storage/secure_storage.dart';
import '../../features/auth/data/auth_repository.dart';

class AuthState {
  final bool isAuthenticated;
  final bool isBanned;
  final bool needsNickname;
  final bool needsAvatar;
  final bool forceUpdate;
  final String? userId;

  const AuthState({
    this.isAuthenticated = false,
    this.isBanned = false,
    this.needsNickname = false,
    this.needsAvatar = false,
    this.forceUpdate = false,
    this.userId,
  });

  AuthState copyWith({
    bool? isAuthenticated,
    bool? isBanned,
    bool? needsNickname,
    bool? needsAvatar,
    bool? forceUpdate,
    String? userId,
  }) {
    return AuthState(
      isAuthenticated: isAuthenticated ?? this.isAuthenticated,
      isBanned: isBanned ?? this.isBanned,
      needsNickname: needsNickname ?? this.needsNickname,
      needsAvatar: needsAvatar ?? this.needsAvatar,
      forceUpdate: forceUpdate ?? this.forceUpdate,
      userId: userId ?? this.userId,
    );
  }
}

class AuthNotifier extends AsyncNotifier<AuthState> {
  @override
  Future<AuthState> build() async {
    final token = await SecureStorageService.getAccessToken();
    if (token == null) return const AuthState();

    try {
      final user = await ref.read(authRepositoryProvider).getMe();
      return AuthState(
        isAuthenticated: true,
        isBanned: user.isBanned,
        needsNickname: user.nickname.isEmpty || user.nickname.startsWith('user_'),
        needsAvatar: user.avatarIndex == null,
        userId: user.id,
      );
    } catch (_) {
      await ref.read(secureStorageProvider).clearAll();
      return const AuthState();
    }
  }

  Future<void> loginWithEmail(String email, String password) async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() async {
      final result = await ref.read(authRepositoryProvider).loginWithEmail(email, password);
      await SecureStorageService.saveTokens(
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      );
      
      // Get full user info after login
      final user = await ref.read(authRepositoryProvider).getMe();
      return AuthState(
        isAuthenticated: true,
        isBanned: user.isBanned,
        needsNickname: user.nickname.isEmpty || user.nickname.startsWith('user_'),
        needsAvatar: user.avatarIndex == null,
        userId: user.id,
      );
    });
  }

  Future<void> registerWithEmail(String email, String password) async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() async {
      final result = await ref.read(authRepositoryProvider).registerWithEmail(email, password);
      await SecureStorageService.saveTokens(
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      );
      return AuthState(
        isAuthenticated: true,
        needsNickname: true,
        needsAvatar: true,
        userId: result.userId,
      );
    });
  }

  Future<void> loginWithGoogle(String idToken) async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() async {
      final result = await ref.read(authRepositoryProvider).loginWithGoogle(idToken);
      await SecureStorageService.saveTokens(
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      );
      
      final user = await ref.read(authRepositoryProvider).getMe();
      return AuthState(
        isAuthenticated: true,
        isBanned: user.isBanned,
        needsNickname: user.nickname.isEmpty || user.nickname.startsWith('user_'),
        needsAvatar: user.avatarIndex == null,
        userId: user.id,
      );
    });
  }

  Future<void> logout() async {
    try {
      await ref.read(authRepositoryProvider).logout();
    } catch (_) {
      // Oturum zaten sunucuda kapalı olabilir, sessizce devam et
    } finally {
      await ref.read(secureStorageProvider).clearAll();
      state = const AsyncValue.data(AuthState());
    }
  }

  Future<void> completeProfile({
    required String nickname,
    required int avatarIndex,
    required String countryCode,
  }) async {
    await ref.read(authRepositoryProvider).completeProfile(
      nickname: nickname,
      avatarIndex: avatarIndex,
      countryCode: countryCode,
    );
    
    // State'i güncelle
    final current = state.value;
    if (current != null) {
      state = AsyncValue.data(current.copyWith(
        needsNickname: false,
        needsAvatar: false,
      ));
    }
  }
}

final authStateProvider = AsyncNotifierProvider<AuthNotifier, AuthState>(
  AuthNotifier.new,
);

// Onboarding geçici state provider'ları
final signupNicknameProvider = StateProvider<String>((ref) => '');
final signupAvatarProvider = StateProvider<int>((ref) => 0);
final signupCountryProvider = StateProvider<String>((ref) => 'XX');
