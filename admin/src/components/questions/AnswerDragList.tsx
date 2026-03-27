// src/components/questions/AnswerDragList.tsx
import {
  DndContext, closestCenter, KeyboardSensor,
  PointerSensor, useSensor, useSensors, DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove, SortableContext,
  sortableKeyboardCoordinates, verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableAnswerRow } from './SortableAnswerRow';

export interface AnswerItem {
  id: string;        // Geçici UI ID
  entityId: string;
  entityName: string;
  countryCode?: string;
  statValue: string;
  statDisplay: string;
}

interface Props {
  answers: AnswerItem[];
  onChange: (updated: AnswerItem[]) => void;
}

export function AnswerDragList({ answers, onChange }: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIdx = answers.findIndex(a => a.id === active.id);
    const newIdx = answers.findIndex(a => a.id === over.id);
    onChange(arrayMove(answers, oldIdx, newIdx));
  }

  return (
    <div className="bg-surface border border-surface-variant rounded-xl p-4">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={answers.map(a => a.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {/* Başlık satırı */}
            <div className="grid grid-cols-[32px_32px_1fr_120px_120px_40px] gap-2
                            text-[10px] font-bold uppercase tracking-wider text-slate-500 px-3 pb-1">
              <span />
              <span className="text-center">Sıra</span>
              <span>Entity</span>
              <span>Stat Değeri</span>
              <span>Görünen Metin</span>
              <span />
            </div>

            {answers.map((answer, idx) => (
              <SortableAnswerRow
                key={answer.id}
                answer={answer}
                rank={idx + 1}
                onUpdate={(updated) => {
                  const newList = [...answers];
                  newList[idx] = updated;
                  onChange(newList);
                }}
                onRemove={() => onChange(answers.filter(a => a.id !== answer.id))}
              />
            ))}

            {answers.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-surface-variant rounded-lg">
                <p className="text-sm text-slate-500">Henüz cevap eklenmedi.</p>
                <p className="text-xs text-slate-600 mt-1">Aşağıdaki arama kutusunu kullanarak entity ekleyin.</p>
              </div>
            )}
          </div>
        </SortableContext>
      </DndContext>
      
      <div className="mt-4 flex items-center gap-2 text-[11px] text-slate-500 bg-background/50 p-2 rounded-lg">
        <span className="text-warning">ℹ️</span>
        <span>Cevapları sürükleyerek sıralayabilirsiniz. Sıralama otomatik olarak güncellenir.</span>
      </div>
    </div>
  );
}
