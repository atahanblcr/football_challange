class ApiEndpoints {
  static const String baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://localhost:3000/api/v1',
  );

  // Auth
  static const String googleLogin    = '/auth/google';
  static const String appleLogin     = '/auth/apple';
  static const String emailRegister  = '/auth/email/register';
  static const String emailLogin     = '/auth/email/login';
  static const String tokenRefresh   = '/auth/refresh';
  static const String logout         = '/auth/logout';

  // Users
  static const String me             = '/users/me';
  static const String myHistory      = '/users/me/history';
  static String checkNickname(String n) => '/users/check-nickname/$n';

  // Questions
  static const String dailyQuestions = '/questions/daily';
  static String startQuestion(String id) => '/questions/$id/start';

  // Sessions
  static String submitSession(String id)   => '/sessions/$id/submit';
  static String sessionResult(String id)   => '/sessions/$id/result';
  static String adIntent(String id)        => '/sessions/$id/ad-intent';
  static String adReward(String id)        => '/sessions/$id/ad-reward';

  // Search
  static const String search         = '/search';

  // Leaderboard
  static const String leaderboard    = '/leaderboard';
  static const String myRanks        = '/leaderboard/me';

  // App Config
  static const String appConfig      = '/app/config';
}
