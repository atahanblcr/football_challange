class User {
  final String id;
  final String nickname;
  final String? email;
  final String? avatarIndex;
  final String? countryCode;
  final bool isBanned;
  final bool pushNotificationsEnabled;

  const User({
    required this.id,
    required this.nickname,
    this.email,
    this.avatarIndex,
    this.countryCode,
    this.isBanned = false,
    this.pushNotificationsEnabled = true,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] as String,
      nickname: json['nickname'] as String? ?? '',
      email: json['email'] as String?,
      avatarIndex: json['avatarIndex']?.toString(),
      countryCode: json['countryCode'] as String?,
      isBanned: json['isBanned'] as bool? ?? false,
      pushNotificationsEnabled: json['pushNotificationsEnabled'] as bool? ?? true,
    );
  }
}
