import React, { useEffect, useState } from 'react';
import { X, Calendar, Tag, DollarSign, AlignLeft } from 'lucide-react';
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
        }
    }, [isOpen, type]);

    const fetchCategories = async () => {
        // Buscar categorias padrão ou do usuário
        // Para simplificar, vou inserir algumas categorias padrão se não existirem na primeira vez,
        // mas aqui vou apenas listar.
        // Nota: Em um app real, criariamos uma seed ou permitiria ao usuário criar.
        // Vou forçar a busca de categorias do tipo selecionado.

        const { data } = await supabase
            .from('categories')
            .select('*')
            .eq('type', type)
            .or(`user_id.eq.${user?.id}`); // AssumindoRLS que permite ler as proprias.

        if (data) setCategories(data);

        // Fallback improvisado se não houver categorias (apenas para demo funcionar sem seed)
        if (!data || data.length === 0) {
            // Poderia criar categorias on-the-fly aqui, mas vou deixar vazio por enquanto
            // e sugerir a criação no UI se for critico.
            // Ou melhor, vou inserir categorias padrão agora.
            await seedCategories();
        }
    };

    const seedCategories = async () => {
        const defaultCategories = type === 'expense'
            ? ['Alimentação', 'Transporte', 'Moradia', 'Lazer']
            : ['Salário', 'Freelance', 'Investimentos'];

        const inserts = defaultCategories.map(name => ({
            user_id: user?.id,
            name,
            type
        }));

        const { data } = await supabase.from('categories').insert(inserts).select();
        if (data) setCategories(data);
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const { error } = await supabase.from('transactions').insert({
            user_id: user?.id,
            amount: parseFloat(amount),
            type,
            category_id: categoryId,
            description,
            date,
        });

        setLoading(false);

        if (!error) {
            onSuccess();
            onClose();
            resetForm();
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

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-[#1e293b] w-full max-w-md rounded-2xl border border-slate-700 shadow-2xl animate-fade-in relative overflow-hidden">

                <div className="p-6 border-b border-slate-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white">Nova Transação</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">

                    <div className="flex bg-slate-900/50 p-1 rounded-xl mb-4">
                        <button
                            type="button"
                            onClick={() => setType('income')}
                            className={clsx(
                                "flex-1 py-2 rounded-lg text-sm font-medium transition-all",
                                type === 'income' ? "bg-emerald-500/20 text-emerald-400 shadow-sm" : "text-slate-400 hover:text-slate-200"
                            )}
                        >
                            Receita
                        </button>
                        <button
                            type="button"
                            onClick={() => setType('expense')}
                            className={clsx(
                                "flex-1 py-2 rounded-lg text-sm font-medium transition-all",
                                type === 'expense' ? "bg-red-500/20 text-red-400 shadow-sm" : "text-slate-400 hover:text-slate-200"
                            )}
                        >
                            Despesa
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div className="relative">
                            <DollarSign className="absolute left-3 top-3.5 text-slate-500" size={18} />
                            <input
                                type="number"
                                step="0.01"
                                placeholder="0,00"
                                value={amount}
                                onChange={e => setAmount(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-purple-500 transition-colors"
                                required
                            />
                        </div>

                        <div className="relative">
                            <Tag className="absolute left-3 top-3.5 text-slate-500" size={18} />
                            <select
                                value={categoryId}
                                onChange={e => setCategoryId(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-purple-500 transition-colors appearance-none"
                                required
                            >
                                <option value="" disabled>Selecione uma categoria</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="relative">
                            <AlignLeft className="absolute left-3 top-3.5 text-slate-500" size={18} />
                            <input
                                type="text"
                                placeholder="Descrição"
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-purple-500 transition-colors"
                            />
                        </div>

                        <div className="relative">
                            <Calendar className="absolute left-3 top-3.5 text-slate-500" size={18} />
                            <input
                                type="date"
                                value={date}
                                onChange={e => setDate(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-purple-500 transition-colors"
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full mt-4 bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-purple-500/20 disabled:opacity-50"
                    >
                        {loading ? 'Salvando...' : 'Salvar Transação'}
                    </button>
                </form>
            </div>
        </div>
    );
};
