import 'package:hive_flutter/hive_flutter.dart';

class HiveStorage {
  static const String draftsBox = 'game_drafts';

  static Future<void> init() async {
    await Hive.initFlutter();
    
    // Box'ları aç
    await Hive.openBox(draftsBox);
    // await Hive.openBox('settings');
    // await Hive.openBox('cache');
  }
}
