import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_text_styles.dart';
import '../../../shared/widgets/primary_button_widget.dart';
import '../../../shared/providers/auth_provider.dart';

class RegisterScreen extends ConsumerStatefulWidget {
  const RegisterScreen({super.key});

  @override
  ConsumerState<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends ConsumerState<RegisterScreen> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();

  Future<void> _register() async {
    if (_passwordController.text != _confirmPasswordController.text) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Şifreler uyuşmuyor!'), backgroundColor: AppColors.wrong),
      );
      return;
    }

    try {
      await ref.read(authStateProvider.notifier).registerWithEmail(
        _emailController.text.trim(),
        _passwordController.text.trim(),
      );
      // Başarılı olursa auth state otomatik olarak nickname ekranına yönlendirecek
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString()), backgroundColor: AppColors.wrong),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authStateProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(backgroundColor: Colors.transparent, elevation: 0),
      body: Padding(
        padding: const EdgeInsets.all(32.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Yeni Hesap Oluştur', style: AppTextStyles.titleLarge),
            const SizedBox(height: 12),
            const Text(
              'Football Challenge dünyasına katıl ve rakiplerinle yarış.',
              style: AppTextStyles.bodyMedium,
            ),
            const SizedBox(height: 48),
            
            TextField(
              controller: _emailController,
              decoration: const InputDecoration(hintText: 'E-posta'),
              style: const TextStyle(color: Colors.white),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _passwordController,
              decoration: const InputDecoration(hintText: 'Şifre'),
              obscureText: true,
              style: const TextStyle(color: Colors.white),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _confirmPasswordController,
              decoration: const InputDecoration(hintText: 'Şifre Tekrar'),
              obscureText: true,
              style: const TextStyle(color: Colors.white),
            ),
            
            const Spacer(),
            
            PrimaryButton(
              label: 'Kayıt Ol',
              isLoading: authState.isLoading,
              onPressed: _register,
            ),
            
            const SizedBox(height: 16),
            
            Center(
              child: TextButton(
                onPressed: () => context.pop(),
                child: const Text('Zaten bir hesabın var mı? Giriş Yap', style: TextStyle(color: AppColors.textSecondary)),
              ),
            ),
          ],
        ),
      ),
    ).animate().fadeIn();
  }
}
