import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/constants/app_text_styles.dart';
import '../../domain/search_result_model.dart';
import '../game_provider.dart';

class AutocompleteWidget extends ConsumerStatefulWidget {
  final String entityType;

  const AutocompleteWidget({super.key, required this.entityType});

  @override
  ConsumerState<AutocompleteWidget> createState() => _AutocompleteWidgetState();
}

class _AutocompleteWidgetState extends ConsumerState<AutocompleteWidget> {
  final _controller = TextEditingController();
  final _focusNode = FocusNode();
  Timer? _debounce;
  String _query = '';

  @override
  void dispose() {
    _controller.dispose();
    _focusNode.dispose();
    _debounce?.cancel();
    super.dispose();
  }

  void _onChanged(String value) {
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 300), () {
      if (mounted) setState(() => _query = value.trim());
    });
  }

  void _onSelect(SearchResult result) {
    ref.read(gameNotifierProvider.notifier).addAnswer(result);
    _controller.clear();
    setState(() => _query = '');
    _focusNode.unfocus();
  }

  @override
  Widget build(BuildContext context) {
    final params = (query: _query, entityType: widget.entityType);
    final resultsAsync = ref.watch(searchResultsProvider(params));

    return Column(
      children: [
        TextField(
          controller: _controller,
          focusNode: _focusNode,
          onChanged: _onChanged,
          decoration: InputDecoration(
            hintText: '${_getHintPrefix()} ara...',
            prefixIcon: const Icon(Icons.search, color: AppColors.textSecondary),
          ),
        ),
        if (_query.length >= 2)
          Container(
            margin: const EdgeInsets.only(top: 4),
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppColors.surfaceVariant),
            ),
            child: resultsAsync.when(
              loading: () => const Padding(padding: EdgeInsets.all(16), child: Center(child: CircularProgressIndicator())),
              error: (_, __) => const Padding(padding: EdgeInsets.all(16), child: Text('Hata oluştu')),
              data: (results) {
                if (results.isEmpty) return const Padding(padding: EdgeInsets.all(16), child: Text('Sonuç yok'));
                return ListView.separated(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: results.length,
                  separatorBuilder: (_, __) => const Divider(height: 1, color: AppColors.surfaceVariant),
                  itemBuilder: (context, index) {
                    final res = results[index];
                    return ListTile(
                      title: Text(res.name, style: AppTextStyles.bodyMedium),
                      subtitle: res.clubName != null ? Text(res.clubName!, style: AppTextStyles.bodySmall) : null,
                      leading: Text(_flagEmoji(res.countryCode), style: const TextStyle(fontSize: 20)),
                      onTap: () => _onSelect(res),
                    );
                  },
                );
              },
            ),
          ),
      ],
    );
  }

  String _getHintPrefix() {
    if (widget.entityType == 'players') return 'Futbolcu';
    if (widget.entityType == 'clubs') return 'Kulüp';
    return 'Entity';
  }

  String _flagEmoji(String? code) {
    if (code == null || code.isEmpty) return '🏳️';
    return code.toUpperCase().runes.map((r) => String.fromCharCode(r + 127397)).join();
  }
}
