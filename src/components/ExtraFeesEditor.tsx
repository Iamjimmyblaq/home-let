import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, X } from 'lucide-react';

export type ExtraFee = { label: string; amount: number };

const PRESETS = ['Service charge', 'Security fee', 'Legal fee', 'Caution fee', 'Agency fee', 'Agreement fee'];

export const ExtraFeesEditor = ({ value, onChange }: { value: ExtraFee[]; onChange: (v: ExtraFee[]) => void }) => {
  const update = (i: number, patch: Partial<ExtraFee>) => onChange(value.map((f, idx) => idx === i ? { ...f, ...patch } : f));
  const remove = (i: number) => onChange(value.filter((_, idx) => idx !== i));
  const add = (label = '') => onChange([...value, { label, amount: 0 }]);

  return (
    <div className="space-y-2">
      {value.map((f, i) => (
        <div key={i} className="grid grid-cols-[1fr_140px_auto] gap-2">
          <Input placeholder="Fee name (e.g. Service charge)" value={f.label} onChange={(e) => update(i, { label: e.target.value })} />
          <Input type="number" min={0} placeholder="₦" value={f.amount || ''} onChange={(e) => update(i, { amount: Number(e.target.value) || 0 })} />
          <Button type="button" variant="ghost" size="icon" onClick={() => remove(i)}><X className="h-4 w-4" /></Button>
        </div>
      ))}
      <div className="flex flex-wrap gap-1.5">
        {PRESETS.filter((p) => !value.some((v) => v.label === p)).map((p) => (
          <Button key={p} type="button" variant="outline" size="sm" className="h-7 text-xs" onClick={() => add(p)}>
            <Plus className="h-3 w-3" /> {p}
          </Button>
        ))}
        <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={() => add()}>
          <Plus className="h-3 w-3" /> Custom
        </Button>
      </div>
      <div className="text-xs text-muted-foreground">These charges are shown to users separately from the main price so payment is transparent.</div>
    </div>
  );
};
