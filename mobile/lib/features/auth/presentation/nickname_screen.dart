import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_text_styles.dart';
import '../../../shared/widgets/primary_button_widget.dart';
import '../../../shared/providers/auth_provider.dart';
import '../data/auth_repository.dart';

class NicknameScreen extends ConsumerStatefulWidget {
  const NicknameScreen({super.key});

  @override
  ConsumerState<NicknameScreen> createState() => _NicknameScreenState();
}

class _NicknameScreenState extends ConsumerState<NicknameScreen> {
  final _controller = TextEditingController();
  bool _isLoading = false;
  bool _isAvailable = false;
  String? _error;

  Future<void> _checkNickname(String val) async {
    if (val.length < 3) {
      setState(() {
        _isAvailable = false;
        _error = 'En az 3 karakter olmalı';
      });
      return;
    }

    try {
      final available = await ref.read(authRepositoryProvider).checkNickname(val);
      setState(() {
        _isAvailable = available;
        _error = available ? null : 'Bu nickname zaten alınmış';
      });
    } catch (e) {
      // Sessiz hata
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(backgroundColor: Colors.transparent, elevation: 0),
      body: Padding(
        padding: const EdgeInsets.all(32.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Sana nasıl hitap edelim?', style: AppTextStyles.titleLarge),
            const SizedBox(height: 12),
            const Text(
              'Sıralamalarda görünecek benzersiz bir nickname seç.',
              style: AppTextStyles.bodyMedium,
            ),
            const SizedBox(height: 48),
            TextField(
              controller: _controller,
              onChanged: _checkNickname,
              decoration: InputDecoration(
                hintText: 'Nickname',
                errorText: _error,
                suffixIcon: _isAvailable 
                    ? const Icon(Icons.check_circle, color: AppColors.correct) 
                    : null,
              ),
              maxLength: 20,
              style: const TextStyle(color: Colors.white, fontSize: 18),
            ),
            const Spacer(),
            PrimaryButton(
              label: 'Devam Et',
              isLoading: _isLoading,
              onPressed: _isAvailable ? () {
                ref.read(signupNicknameProvider.notifier).state = _controller.text.trim();
                context.push(RouteNames.avatarCountry);
              } : null,
            ),
          ],
        ),
      ),
    );
  }
}
