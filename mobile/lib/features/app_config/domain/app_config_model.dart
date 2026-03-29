class AppConfig {
  final String minimumVersion;
  final String latestVersion;
  final bool forceUpdate;
  final ActiveEvent? activeEvent;
  final ScoringConfig? scoring;

  const AppConfig({
    required this.minimumVersion,
    required this.latestVersion,
    required this.forceUpdate,
    this.activeEvent,
    this.scoring,
  });

  factory AppConfig.fromJson(Map<String, dynamic> json) {
    return AppConfig(
      minimumVersion: json['minimum_version'] as String,
      latestVersion: json['latest_version'] as String,
      forceUpdate: json['force_update'] as bool,
      activeEvent: json['active_event'] != null 
          ? ActiveEvent.fromJson(json['active_event']) 
          : null,
      scoring: json['scoring'] != null
          ? ScoringConfig.fromJson(json['scoring'])
          : null,
    );
  }
}

class ActiveEvent {
  final String id;
  final String name;
  final DateTime endsAt;

  const ActiveEvent({
    required this.id,
    required this.name,
    required this.endsAt,
  });

  factory ActiveEvent.fromJson(Map<String, dynamic> json) {
    return ActiveEvent(
      id: json['id'] as String,
      name: json['name'] as String,
      endsAt: DateTime.parse(json['endsAt'] as String),
    );
  }
}

class ScoringConfig {
  final double adMultiplier;
  final double difficultyMediumMultiplier;
  final double difficultyHardMultiplier;
  final int maxTimeBonus;

  const ScoringConfig({
    required this.adMultiplier,
    required this.difficultyMediumMultiplier,
    required this.difficultyHardMultiplier,
    required this.maxTimeBonus,
  });

  factory ScoringConfig.fromJson(Map<String, dynamic> json) {
    return ScoringConfig(
      adMultiplier: (json['adMultiplier'] as num).toDouble(),
      difficultyMediumMultiplier: (json['difficultyMediumMultiplier'] as num).toDouble(),
      difficultyHardMultiplier: (json['difficultyHardMultiplier'] as num).toDouble(),
      maxTimeBonus: json['maxTimeBonus'] as int,
    );
  }
}
