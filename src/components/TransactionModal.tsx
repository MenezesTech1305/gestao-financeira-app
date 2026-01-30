import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Calendar, Tag, AlignLeft } from 'lucide-react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import clsx from 'clsx';

interface TransactionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

interface Category {
    id: string;
    name: string;
    type: 'income' | 'expense';
}

export const TransactionModal = ({ isOpen, onClose, onSuccess }: TransactionModalProps) => {
    const { user } = useAuth();
    const [type, setType] = useState<'income' | 'expense'>('expense');
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchCategories();
            // Bloqueia o scroll do corpo da página quando o modal está aberto
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
            resetForm(); // Reseta o formulário ao fechar
        }

        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, type]);

    const fetchCategories = async () => {
        const { data } = await supabase
            .from('categories')
            .select('*')
            .eq('type', type)
            .or(`user_id.eq.${user?.id}`);

        if (data) {
            setCategories(data);

            // Auto-migration: Check if 'Saúde' exists for expense, if not, create it
            if (type === 'expense' && !data.find(c => c.name === 'Saúde')) {
                await supabase.from('categories').insert({
                    user_id: user?.id,
                    name: 'Saúde',
                    type: 'expense'
                });
                // Refresh
                fetchCategories();
                return;
            }
        }

        if (!data || data.length === 0) {
            await seedCategories();
        }
    };

    const seedCategories = async () => {
        const defaultCategories = type === 'expense'
            ? ['Alimentação', 'Transporte', 'Moradia', 'Lazer', 'Saúde']
            : ['Salário', 'Freelance', 'Investimentos'];

        const inserts = defaultCategories.map(name => ({
            user_id: user?.id,
            name,
            type
        }));

        const { data } = await supabase.from('categories').insert(inserts).select();
        if (data) setCategories(data);
    }

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, '');
        setAmount(value);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const floatAmount = Number(amount) / 100;

        const { error } = await supabase.from('transactions').insert({
            user_id: user?.id,
            amount: floatAmount,
            type,
            category_id: categoryId,
            description,
            date,
        });

        setLoading(false);

        if (!error) {
            onSuccess();
            onClose();
            // O resetForm já é chamado no useEffect quando isOpen muda para false
        } else {
            alert('Erro ao salvar transação: ' + error.message);
        }
    };

    const resetForm = () => {
        setAmount('');
        setDescription('');
        setCategoryId('');
        setDate(new Date().toISOString().split('T')[0]);
    };

    if (!isOpen) return null;

    // Uso de Portal para renderizar fora da hierarquia DOM normal e evitar problemas de z-index/transform
    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in" style={{ animationDuration: '0.2s' }}>
            {/* Overlay click handler could be added here */}

            <div className="bg-[#1e293b] w-full max-w-lg rounded-2xl border border-slate-700 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">

                <div className="p-6 border-b border-slate-700 flex justify-between items-center shrink-0 bg-[#1e293b]">
                    <h2 className="text-xl font-bold text-white">Nova Transação</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-1 hover:bg-slate-800 rounded-full">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto custom-scrollbar bg-[#1e293b]">
                    <form onSubmit={handleSubmit} className="space-y-6">

                        <div className="flex bg-slate-900/50 p-1.5 rounded-xl gap-1">
                            <button
                                type="button"
                                onClick={() => setType('income')}
                                className={clsx(
                                    "flex-1 py-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2",
                                    type === 'income' ? "bg-emerald-500/20 text-emerald-400 shadow-sm ring-1 ring-emerald-500/50" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                                )}
                            >
                                Receita
                            </button>
                            <button
                                type="button"
                                onClick={() => setType('expense')}
                                className={clsx(
                                    "flex-1 py-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2",
                                    type === 'expense' ? "bg-red-500/20 text-red-400 shadow-toggle ring-1 ring-red-500/50" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                                )}
                            >
                                Despesa
                            </button>
                        </div>

                        <div className="space-y-5">
                            {/* Valor */}
                            <div className="relative group">
                                <label className="block text-xs font-semibold text-slate-400 mb-1.5 ml-1 uppercase tracking-wider">Valor</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold group-focus-within:text-purple-400 transition-colors">R$</span>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        placeholder="0,00"
                                        value={amount ? (Number(amount) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : ''}
                                        onChange={handleAmountChange}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3.5 pl-12 pr-4 text-white text-lg font-medium focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all placeholder:text-slate-600"
                                        required
                                        autoFocus
                                    />
                                </div>
                            </div>

                            {/* Categoria */}
                            <div className="relative group">
                                <label className="block text-xs font-semibold text-slate-400 mb-1.5 ml-1 uppercase tracking-wider">Categoria</label>
                                <div className="relative">
                                    <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-purple-400 transition-colors" size={18} />
                                    <select
                                        value={categoryId}
                                        onChange={e => setCategoryId(e.target.value)}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3.5 pl-12 pr-10 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all appearance-none cursor-pointer truncate"
                                        required
                                    >
                                        <option value="" disabled>Selecione uma categoria</option>
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                                    </div>
                                </div>
                            </div>

                            {/* Descrição */}
                            <div className="relative group">
                                <label className="block text-xs font-semibold text-slate-400 mb-1.5 ml-1 uppercase tracking-wider">Descrição</label>
                                <div className="relative">
                                    <AlignLeft className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-purple-400 transition-colors" size={18} />
                                    <input
                                        type="text"
                                        placeholder="Ex: Compras no mercado"
                                        value={description}
                                        onChange={e => setDescription(e.target.value)}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3.5 pl-12 pr-4 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all placeholder:text-slate-600"
                                    />
                                </div>
                            </div>

                            {/* Data */}
                            <div className="relative group">
                                <label className="block text-xs font-semibold text-slate-400 mb-1.5 ml-1 uppercase tracking-wider">Data</label>
                                <div className="relative">
                                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-purple-400 transition-colors" size={18} />
                                    <input
                                        type="date"
                                        value={date}
                                        onChange={e => setDate(e.target.value)}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3.5 pl-12 pr-4 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all cursor-pointer"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full mt-6 bg-purple-600 hover:bg-purple-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-purple-500/40 active:scale-[0.98] text-lg"
                        >
                            {loading ? 'Salvando...' : 'Salvar Transação'}
                        </button>
                    </form>
                </div>
            </div>
        </div>,
        document.body
    );
};
