class Badge {
  final String id;
  final String name;
  final String description;
  final String icon;
  final DateTime earnedAt;

  const Badge({
    required this.id,
    required this.name,
    required this.description,
    required this.icon,
    required this.earnedAt,
  });

  factory Badge.fromJson(Map<String, dynamic> json) {
    return Badge(
      id: json['id'] as String,
      name: json['name'] as String,
      description: json['description'] as String,
      icon: json['icon'] as String,
      earnedAt: DateTime.parse(json['earnedAt'] as String),
    );
  }
}

class User {
  final String id;
  final String nickname;
  final String? email;
  final String? avatarIndex;
  final String? countryCode;
  final bool isBanned;
  final bool pushNotificationsEnabled;
  final List<Badge> badges;

  const User({
    required this.id,
    required this.nickname,
    this.email,
    this.avatarIndex,
    this.countryCode,
    this.isBanned = false,
    this.pushNotificationsEnabled = true,
    this.badges = const [],
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
      badges: (json['badges'] as List? ?? [])
          .map((e) => Badge.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }
}
