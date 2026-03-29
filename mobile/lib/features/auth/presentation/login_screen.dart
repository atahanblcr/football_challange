import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_text_styles.dart';
import '../../../shared/widgets/primary_button_widget.dart';
import '../../../shared/providers/auth_provider.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  bool _showEmailForm = false;
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();

  Future<void> _loginEmail() async {
    try {
      await ref.read(authStateProvider.notifier).loginWithEmail(
        _emailController.text.trim(),
        _passwordController.text.trim(),
      );
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
      body: Container(
        width: double.infinity,
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              AppColors.primary.withOpacity(0.2),
              AppColors.background,
            ],
          ),
        ),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(32.0),
            child: Column(
              children: [
                const Spacer(),
                const Text(
                  '⚽',
                  style: TextStyle(fontSize: 80),
                ).animate().scale(duration: 600.ms, curve: Curves.backOut),
                
                const SizedBox(height: 24),
                
                const Text(
                  'FOOTBALL CHALLENGE',
                  style: AppTextStyles.titleLarge,
                  textAlign: TextAlign.center,
                ).animate().fadeIn(delay: 200.ms),
                
                const SizedBox(height: 12),
                
                const Text(
                  'Gerçek istatistiklerle futbol bilgini yarıştır.',
                  style: AppTextStyles.bodyLarge,
                  textAlign: TextAlign.center,
                ).animate().fadeIn(delay: 400.ms),
                
                const Spacer(),
                
                if (!_showEmailForm) ...[
                  // Social Login Buttons
                  PrimaryButton(
                    label: 'Google ile Devam Et',
                    icon: Icons.login,
                    isLoading: authState.isLoading,
                    onPressed: () {
                      // ref.read(authStateProvider.notifier).loginWithGoogle("token");
                    },
                  ).animate().fadeIn(delay: 600.ms).slideY(begin: 0.2, end: 0),
                  
                  const SizedBox(height: 16),
                  
                  PrimaryButton(
                    label: 'Apple ile Devam Et',
                    backgroundColor: Colors.black,
                    icon: Icons.apple,
                    isLoading: authState.isLoading,
                    onPressed: () {
                      // ref.read(authStateProvider.notifier).loginWithApple();
                    },
                  ).animate().fadeIn(delay: 800.ms).slideY(begin: 0.2, end: 0),
                  
                  const SizedBox(height: 24),
                  
                  TextButton(
                    onPressed: () => setState(() => _showEmailForm = true),
                    child: Text(
                      'E-posta ile Giriş Yap',
                      style: AppTextStyles.bodyMedium.copyWith(
                        color: AppColors.textSecondary,
                        decoration: TextDecoration.underline,
                      ),
                    ),
                  ).animate().fadeIn(delay: 1000.ms),
                ] else ...[
                  // Email Login Form
                  Column(
                    children: [
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
                      const SizedBox(height: 24),
                      PrimaryButton(
                        label: 'Giriş Yap',
                        isLoading: authState.isLoading,
                        onPressed: _loginEmail,
                      ),
                      TextButton(
                        onPressed: () => setState(() => _showEmailForm = false),
                        child: const Text('Geri Dön', style: TextStyle(color: AppColors.textSecondary)),
                      ),
                    ],
                  ).animate().fadeIn(),
                ],
                
                const SizedBox(height: 16),
                
                const Text(
                  'Giriş yaparak kullanım koşullarını kabul etmiş olursunuz.',
                  style: TextStyle(color: Colors.white24, fontSize: 10),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
