import 'package:hive_flutter/hive_flutter.dart';

class HiveStorage {
  static Future<void> init() async {
    await Hive.initFlutter();
    
    // Box'ları aç
    // await Hive.openBox('settings');
    // await Hive.openBox('cache');
  }
}
