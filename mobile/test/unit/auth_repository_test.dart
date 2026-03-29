import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:dio/dio.dart';
import 'package:football_challenge/features/auth/data/auth_repository.dart';
import 'package:football_challenge/features/auth/domain/user_model.dart';

class MockDio extends Mock implements Dio {}
class MockResponse extends Mock implements Response {}

void main() {
  late MockDio mockDio;
  late AuthRepository authRepository;

  setUp(() {
    mockDio = MockDio();
    authRepository = AuthRepository(mockDio);
  });

  group('AuthRepository Unit Tests', () {
    test('getMe should return a User on success', () async {
      final mockResponse = MockResponse();
      when(() => mockResponse.data).thenReturn({
        'data': {
          'id': 'u1',
          'nickname': 'TestUser',
          'email': 'test@example.com',
          'isBanned': false,
        }
      });
      when(() => mockDio.get(any())).thenAnswer((_) async => mockResponse);

      final user = await authRepository.getMe();

      expect(user, isA<User>());
      expect(user.nickname, 'TestUser');
      verify(() => mockDio.get(any())).called(1);
    });

    test('loginWithEmail should return AuthResponse on success', () async {
      final mockResponse = MockResponse();
      when(() => mockResponse.data).thenReturn({
        'data': {
          'accessToken': 'at123',
          'refreshToken': 'rt123',
          'user': {'id': 'u1'},
          'isNewUser': false,
        }
      });
      when(() => mockDio.post(any(), data: any(named: 'data')))
          .thenAnswer((_) async => mockResponse);

      final result = await authRepository.loginWithEmail('test@e.com', 'pass');

      expect(result.accessToken, 'at123');
      expect(result.isNewUser, false);
    });
  });
}
