import { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { TransactionModal } from '../components/TransactionModal';
import { Plus, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Transaction {
    id: string;
    description: string;
    amount: number;
    type: 'income' | 'expense';
    date: string;
    category: { name: string } | null;
}

export const Transactions = () => {
    const { user } = useAuth();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    const fetchTransactions = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('transactions')
            .select(`
        *,
        category:categories(name)
      `)
            .order('date', { ascending: false })
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching transactions:', error);
        } else {
            setTransactions(data || []);
        }
        setLoading(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir esta transação?')) return;

        await supabase.from('transactions').delete().eq('id', id);
        fetchTransactions();
    }

    useEffect(() => {
        fetchTransactions();
    }, [user]);

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-white mb-2">Transações</h2>
                    <p className="text-slate-400">Histórico completo de entradas e saídas</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-3 rounded-xl flex items-center gap-2 font-medium transition-all shadow-lg shadow-purple-500/20 active:scale-95"
                >
                    <Plus size={20} />
                    Nova Transação
                </button>
            </div>

            <div className="glass rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-700/50 bg-slate-800/30 text-slate-400 text-sm uppercase tracking-wider">
                                <th className="p-4 font-medium">Data</th>
                                <th className="p-4 font-medium">Descrição</th>
                                <th className="p-4 font-medium">Categoria</th>
                                <th className="p-4 font-medium">Valor</th>
                                <th className="p-4 font-medium text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={5} className="p-8 text-center text-slate-500">Carregando...</td></tr>
                            ) : transactions.length === 0 ? (
                                <tr><td colSpan={5} className="p-8 text-center text-slate-500">Nenhuma transação encontrada.</td></tr>
                            ) : (
                                transactions.map((t) => (
                                    <tr key={t.id} className="border-b border-slate-700/30 hover:bg-white/5 transition-colors">
                                        <td className="p-4 text-slate-300">
                                            {t.date.split('T')[0].split('-').reverse().join('/')}
                                        </td>
                                        <td className="p-4 text-white font-medium">{t.description || 'Sem descrição'}</td>
                                        <td className="p-4 text-slate-400 text-sm">
                                            <span className="bg-slate-800 px-2 py-1 rounded text-xs border border-slate-700">
                                                {t.category?.name || 'Geral'}
                                            </span>
                                        </td>
                                        <td className="p-4 font-bold">
                                            <span className={t.type === 'income' ? 'text-emerald-400' : 'text-red-400'}>
                                                {t.type === 'income' ? '+' : '-'} R$ {t.amount.toFixed(2)}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <button onClick={() => handleDelete(t.id)} className="text-slate-500 hover:text-red-400 transition-colors p-2 hover:bg-red-500/10 rounded-lg">
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <TransactionModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchTransactions}
            />
        </div>
    );
};
