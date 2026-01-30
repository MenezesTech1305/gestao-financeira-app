import React, { useEffect, useState } from 'react';
import { X, Save, Repeat } from 'lucide-react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';

interface RecurringModalProps {
    onClose: () => void;
    onSuccess: () => void;
    expense?: any;
}

export function RecurringModal({ onClose, onSuccess, expense }: RecurringModalProps) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState<any[]>([]);

    const [title, setTitle] = useState(expense?.title || '');
    const [amount, setAmount] = useState(expense?.amount || '');
    const [categoryId, setCategoryId] = useState(expense?.category_id || '');
    const [dayOfMonth, setDayOfMonth] = useState(expense?.day_of_month || '5');

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const { data } = await supabase
                .from('categories')
                .select('*')
                .eq('type', 'expense')
                .or(`user_id.is.null,user_id.eq.${user?.id}`);
            setCategories(data || []);

            // Se for novo e tiver categorias, seleciona a primeira
            if (!expense && data && data.length > 0) {
                setCategoryId(data[0].id);
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const payload = {
                user_id: user?.id,
                title,
                amount: parseFloat(amount),
                category_id: categoryId,
                day_of_month: parseInt(dayOfMonth),
                active: true
            };

            let error;

            if (expense?.id) {
                const { error: err } = await supabase
                    .from('recurring_expenses')
                    .update(payload)
                    .eq('id', expense.id);
                error = err;
            } else {
                const { error: err } = await supabase
                    .from('recurring_expenses')
                    .insert(payload);
                error = err;
            }

            if (error) throw error;

            onSuccess();
            onClose();
        } catch (err: any) {
            alert('Erro ao salvar conta recorrente: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-lg bg-[#1e293b]/90 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl animate-fade-in">
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400">
                            <Repeat size={24} />
                        </div>
                        <h2 className="text-xl font-bold text-white">
                            {expense ? 'Editar Conta Fixa' : 'Nova Conta Fixa'}
                        </h2>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Nome da Conta</label>
                        <input
                            type="text"
                            required
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-600"
                            placeholder="Ex: Aluguel, Internet"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Valor (R$)</label>
                            <input
                                type="number"
                                step="0.01"
                                required
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                placeholder="0.00"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Dia do Vencimento</label>
                            <input
                                type="number"
                                min="1"
                                max="31"
                                required
                                value={dayOfMonth}
                                onChange={(e) => setDayOfMonth(e.target.value)}
                                className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Categoria</label>
                        <select
                            value={categoryId}
                            onChange={(e) => setCategoryId(e.target.value)}
                            className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all [&>option]:bg-slate-900"
                        >
                            <option value="" disabled>Selecione uma categoria</option>
                            {categories.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.name}
                                </option>
                            ))}
                        </select>
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
                            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            <Save size={18} />
                            {loading ? 'Salvando...' : 'Salvar Conta'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
