import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, Repeat, Tag, Calendar, AlignLeft } from 'lucide-react';
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
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    const fetchCategories = async () => {
        try {
            const { data } = await supabase
                .from('categories')
                .select('*')
                .eq('type', 'expense')
                .or(`user_id.is.null,user_id.eq.${user?.id}`);

            // Auto-add 'Empresa' if missing in expense categories
            if (data && !data.find(c => c.name === 'Empresa')) {
                await supabase.from('categories').insert({
                    user_id: user?.id,
                    name: 'Empresa',
                    type: 'expense'
                });
                // Recursive call to get the new list including Empresa
                fetchCategories();
                return;
            }

            setCategories(data || []);

            // Se for novo e tiver categorias, seleciona a primeira
            if (!expense && data && data.length > 0) {
                setCategoryId(data[0].id);
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, ''); // Remove non-digits
        setAmount(value);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const payload = {
                user_id: user?.id,
                title,
                amount: Number(amount) / 100, // Convert string "2500" to 25.00
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

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in" style={{ animationDuration: '0.2s' }}>
            <div className="bg-[#1e293b] w-full max-w-lg rounded-2xl border border-slate-700 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">

                <div className="p-6 border-b border-slate-700 flex justify-between items-center shrink-0 bg-[#1e293b]">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400">
                            <Repeat size={24} />
                        </div>
                        <h2 className="text-xl font-bold text-white">
                            {expense ? 'Editar Conta Fixa' : 'Nova Conta Fixa'}
                        </h2>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-1 hover:bg-slate-800 rounded-full">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto custom-scrollbar bg-[#1e293b]">
                    <form onSubmit={handleSubmit} className="space-y-6">

                        {/* Nome da Conta */}
                        <div className="relative group">
                            <label className="block text-xs font-semibold text-slate-400 mb-1.5 ml-1 uppercase tracking-wider">Nome da Conta</label>
                            <div className="relative">
                                <AlignLeft className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={18} />
                                <input
                                    type="text"
                                    required
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3.5 pl-12 pr-4 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-600"
                                    placeholder="Ex: Aluguel, Internet"
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {/* Valor */}
                            <div className="relative group">
                                <label className="block text-xs font-semibold text-slate-400 mb-1.5 ml-1 uppercase tracking-wider">Valor (R$)</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold group-focus-within:text-blue-400 transition-colors">R$</span>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        required
                                        value={amount ? (Number(amount) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : ''}
                                        onChange={handleAmountChange}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3.5 pl-12 pr-4 text-white font-medium focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                                        placeholder="0,00"
                                    />
                                </div>
                            </div>

                            {/* Dia Vencimento */}
                            <div className="relative group">
                                <label className="block text-xs font-semibold text-slate-400 mb-1.5 ml-1 uppercase tracking-wider">Dia Vencimento</label>
                                <div className="relative">
                                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={18} />
                                    <input
                                        type="number"
                                        min="1"
                                        max="31"
                                        required
                                        value={dayOfMonth}
                                        onChange={(e) => setDayOfMonth(e.target.value)}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3.5 pl-12 pr-4 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Categoria */}
                        <div className="relative group">
                            <label className="block text-xs font-semibold text-slate-400 mb-1.5 ml-1 uppercase tracking-wider">Categoria</label>
                            <div className="relative">
                                <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={18} />
                                <select
                                    value={categoryId}
                                    onChange={(e) => setCategoryId(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3.5 pl-12 pr-10 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all appearance-none cursor-pointer truncate"
                                >
                                    <option value="" disabled>Selecione uma categoria</option>
                                    {categories.map((cat) => (
                                        <option key={cat.id} value={cat.id}>
                                            {cat.name}
                                        </option>
                                    ))}
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                                </div>
                            </div>
                        </div>

                        <div className="pt-2 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-5 py-3 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors font-medium"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-blue-500/40 active:scale-[0.98] flex items-center justify-center gap-2"
                            >
                                {loading ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : <><Save size={20} /> Salvar Conta</>}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>,
        document.body
    );
}
