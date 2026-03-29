class User {
  final String id;
  final String nickname;
  final String? email;
  final String? avatarIndex;
  final String? countryCode;
  final bool isBanned;

  const User({
    required this.id,
    required this.nickname,
    this.email,
    this.avatarIndex,
    this.countryCode,
    this.isBanned = false,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] as String,
      nickname: json['nickname'] as String? ?? '',
      email: json['email'] as String?,
      avatarIndex: json['avatarIndex']?.toString(),
      countryCode: json['countryCode'] as String?,
      isBanned: json['isBanned'] as bool? ?? false,
    );
  }
}
