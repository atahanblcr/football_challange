import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../features/auth/data/repositories/auth_repository.dart';
import '../../features/profile/data/repositories/profile_repository.dart';

final notificationServiceProvider = Provider<NotificationService>((ref) {
  return NotificationService(ref);
});

class NotificationService {
  final Ref _ref;
  final FirebaseMessaging _fcm = FirebaseMessaging.instance;

  NotificationService(this._ref);

  Future<void> initialize() async {
    // İzin iste (iOS için kritik)
    NotificationSettings settings = await _fcm.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );

    if (settings.authorizationStatus == AuthorizationStatus.authorized) {
      debugPrint('User granted push notification permission');
      
      // Token al ve kaydet
      await _updateToken();

      // Token yenilendiğinde dinle
      _fcm.onTokenRefresh.listen((token) {
        _saveTokenToBackend(token);
      });

      // Uygulama açıkken gelen mesajlar
      FirebaseMessaging.onMessage.listen((RemoteMessage message) {
        debugPrint('Got a message while in the foreground!');
        debugPrint('Message data: ${message.data}');

        if (message.notification != null) {
          debugPrint('Message also contained a notification: ${message.notification?.title}');
        }
      });
    } else {
      debugPrint('User declined or has not accepted push notification permission');
    }
  }

  Future<void> _updateToken() async {
    try {
      String? token = await _fcm.getToken();
      if (token != null) {
        await _saveTokenToBackend(token);
      }
    } catch (e) {
      debugPrint('Error getting FCM token: $e');
    }
  }

  Future<void> _saveTokenToBackend(String token) async {
    // Sadece giriş yapmış kullanıcılar için token kaydet
    final authState = _ref.read(authRepositoryProvider).currentUser;
    if (authState != null) {
      try {
        await _ref.read(profileRepositoryProvider).updateProfile(fcmToken: token);
        debugPrint('FCM Token successfully synced with backend');
      } catch (e) {
        debugPrint('Failed to sync FCM token with backend: $e');
      }
    }
  }
}
