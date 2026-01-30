import React, { useState } from 'react';
import { X, Save, Target } from 'lucide-react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';

interface GoalModalProps {
  onClose: () => void;
  onSuccess: () => void;
  goal?: any; // Se passado, é modo edição
}

const COLORS = [
  { name: 'Roxo', value: '#8b5cf6' },
  { name: 'Azul', value: '#3b82f6' },
  { name: 'Verde', value: '#22c55e' },
  { name: 'Laranja', value: '#f97316' },
  { name: 'Rosa', value: '#ec4899' },
  { name: 'Vermelho', value: '#ef4444' },
];

export function GoalModal({ onClose, onSuccess, goal }: GoalModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const [title, setTitle] = useState(goal?.title || '');
  const [targetAmount, setTargetAmount] = useState(goal?.target_amount || '');
  const [currentAmount, setCurrentAmount] = useState(goal?.current_amount || '0');
  const [deadline, setDeadline] = useState(goal?.deadline || '');
  const [color, setColor] = useState(goal?.color || COLORS[0].value);

  const handleAmountChange = (setter: React.Dispatch<React.SetStateAction<string>>) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    setter(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        user_id: user?.id,
        title,
        target_amount: Number(targetAmount) / 100,
        current_amount: Number(currentAmount) / 100,
        deadline: deadline || null,
        color
      };

      // ... rest of logic
      let error;

      if (goal?.id) {
        const { error: err } = await supabase
          .from('goals')
          .update(payload)
          .eq('id', goal.id);
        error = err;
      } else {
        const { error: err } = await supabase
          .from('goals')
          .insert(payload);
        error = err;
      }

      if (error) throw error;

      onSuccess();
      onClose();
    } catch (err: any) {
      alert('Erro ao salvar meta: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-[#1e293b]/90 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl animate-fade-in">
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-[${color}]/20`} style={{ color: color }}>
              <Target size={24} />
            </div>
            <h2 className="text-xl font-bold text-white">
              {goal ? 'Editar Meta' : 'Nova Meta'}
            </h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Título</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all placeholder:text-slate-600"
              placeholder="Ex: Viagem para Europa"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Meta (R$)</label>
              <input
                type="text"
                inputMode="numeric"
                required
                value={targetAmount ? (Number(targetAmount) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : ''}
                onChange={handleAmountChange(setTargetAmount)}
                className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                placeholder="0,00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Guardado (R$)</label>
              <input
                type="text"
                inputMode="numeric"
                value={currentAmount ? (Number(currentAmount) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : ''}
                onChange={handleAmountChange(setCurrentAmount)}
                className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                placeholder="0,00"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Prazo (Opcional)</label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all [color-scheme:dark]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Cor do Card</label>
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColor(c.value)}
                  className={`w-8 h-8 rounded-full transition-all ${color === c.value ? 'ring-2 ring-white scale-110' : 'opacity-70 hover:opacity-100 hover:scale-110'}`}
                  style={{ backgroundColor: c.value }}
                  title={c.name}
                />
              ))}
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Save size={18} />
              {loading ? 'Salvando...' : 'Salvar Meta'}
            </button>
          </div>
        </form >
      </div >
    </div >
  );
}
