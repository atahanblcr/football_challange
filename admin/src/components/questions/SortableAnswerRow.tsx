// src/components/questions/SortableAnswerRow.tsx
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2 } from 'lucide-react';
import { AnswerItem } from './AnswerDragList';

interface Props {
  answer: AnswerItem;
  rank: number;
  onUpdate: (updated: AnswerItem) => void;
  onRemove: () => void;
}

export function SortableAnswerRow({ answer, rank, onUpdate, onRemove }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: answer.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="grid grid-cols-[32px_32px_1fr_120px_120px_40px] gap-2 items-center
                 bg-surface-variant rounded-lg px-3 py-2 border border-transparent hover:border-slate-500 transition-colors"
    >
      {/* Sürükleme tutacağı */}
      <button
        {...attributes}
        {...listeners}
        type="button"
        className="cursor-grab text-slate-500 hover:text-slate-300"
      >
        <GripVertical size={16} />
      </button>

      {/* Rank (otomatik, sürüklemeyle değişir) */}
      <span className="text-xs text-slate-400 font-bold text-center">{rank}</span>

      {/* Entity adı */}
      <div className="flex items-center gap-2 text-sm overflow-hidden">
        {answer.countryCode && (
          <span className="shrink-0">{flagEmoji(answer.countryCode)}</span>
        )}
        <span className="truncate font-medium text-slate-200">{answer.entityName}</span>
      </div>

      {/* Stat değeri */}
      <input
        className={`bg-background text-sm px-2 py-1.5 rounded border outline-none text-white w-full transition-colors ${
          !answer.statValue ? 'border-red-500/50 focus:border-red-500' : 'border-surface focus:border-primary'
        }`}
        value={answer.statValue}
        onChange={e => onUpdate({ ...answer, statValue: e.target.value })}
        placeholder="Değer (örn: 192)"
      />

      {/* Görünen metin */}
      <input
        className={`bg-background text-sm px-2 py-1.5 rounded border outline-none text-white w-full transition-colors ${
          !answer.statDisplay ? 'border-red-500/50 focus:border-red-500' : 'border-surface focus:border-primary'
        }`}
        value={answer.statDisplay}
        onChange={e => onUpdate({ ...answer, statDisplay: e.target.value })}
        placeholder="Etiket (örn: 192 Asist)"
      />

      {/* Sil */}
      <button
        type="button"
        onClick={onRemove}
        className="text-slate-500 hover:text-red-400 transition-colors flex justify-center"
      >
        <Trash2 size={15} />
      </button>
    </div>
  );
}

function flagEmoji(code: string) {
  if (!code) return '';
  return code.toUpperCase().split('').map(c =>
    String.fromCodePoint(c.charCodeAt(0) + 127397)
  ).join('');
}
