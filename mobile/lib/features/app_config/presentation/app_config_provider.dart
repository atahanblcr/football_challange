import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/app_config_repository.dart';
import '../domain/app_config_model.dart';

final appConfigProvider = FutureProvider<AppConfig>((ref) async {
  return ref.watch(appConfigRepositoryProvider).getConfig();
});
