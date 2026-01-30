import { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { ArrowUp, ArrowDown, Wallet, Plus, BarChart3 } from 'lucide-react';
import { TransactionModal } from '../components/TransactionModal';
import { FinancialChart } from '../components/FinancialChart';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';

export const Dashboard = () => {
    const { user } = useAuth();
    const [balance, setBalance] = useState({ total: 0, income: 0, expense: 0 });
    const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
    const [allTransactions, setAllTransactions] = useState<any[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        if (!user) return;
        setLoading(true);

        // Fetch transactions
        const { data: transactions } = await supabase
            .from('transactions')
            .select('*')
            .order('date', { ascending: false });

        if (transactions) {
            const income = transactions
                .filter(t => t.type === 'income')
                .reduce((acc, curr) => acc + Number(curr.amount), 0);

            const expense = transactions
                .filter(t => t.type === 'expense')
                .reduce((acc, curr) => acc + Number(curr.amount), 0);

            setBalance({
                total: income - expense,
                income,
                expense
            });

            setAllTransactions(transactions);
            setRecentTransactions(transactions.slice(0, 5));
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, [user]);

    return (
        <div>
            <header className="mb-8 flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-bold text-white mb-2">Visão Geral</h2>
                    <p className="text-slate-400">Bem-vindo de volta, {user?.user_metadata?.full_name || 'Usuário'}.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20 active:scale-95 transition-all"
                >
                    <Plus size={24} />
                </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="glass p-6 rounded-2xl border-t-4 border-t-purple-500 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Wallet size={64} />
                    </div>
                    <p className="text-slate-400 text-sm font-medium mb-1">Saldo Total</p>
                    <h3 className="text-3xl font-bold text-white">
                        R$ {balance.total.toFixed(2)}
                    </h3>
                </div>

                <div className="glass p-6 rounded-2xl border-t-4 border-t-emerald-500 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-emerald-500">
                        <ArrowUp size={64} />
                    </div>
                    <p className="text-slate-400 text-sm font-medium mb-1">Receitas</p>
                    <h3 className="text-emerald-400 text-3xl font-bold">
                        R$ {balance.income.toFixed(2)}
                    </h3>
                </div>

                <div className="glass p-6 rounded-2xl border-t-4 border-t-red-500 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-red-500">
                        <ArrowDown size={64} />
                    </div>
                    <p className="text-slate-400 text-sm font-medium mb-1">Despesas</p>
                    <h3 className="text-red-400 text-3xl font-bold">
                        R$ {balance.expense.toFixed(2)}
                    </h3>
                </div>
            </div>

            <div className="glass p-8 rounded-2xl mb-8">
                <div className="flex items-center gap-2 mb-6">
                    <BarChart3 className="text-purple-400" size={24} />
                    <h3 className="text-xl font-bold text-white">Fluxo Financeiro</h3>
                </div>
                <FinancialChart transactions={allTransactions} />
            </div>

            <div className="glass p-8 rounded-2xl">
                <h3 className="text-xl font-bold text-white mb-6">Transações Recentes</h3>

                <div className="space-y-4">
                    {loading ? (
                        <p className="text-slate-500">Carregando...</p>
                    ) : recentTransactions.length === 0 ? (
                        <p className="text-slate-500">Nenhuma transação recente.</p>
                    ) : (
                        recentTransactions.map(t => (
                            <div key={t.id} className="flex items-center justify-between p-4 bg-slate-800/30 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-slate-700/50">
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${t.type === 'income' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                                        {t.type === 'income' ? <ArrowUp size={20} /> : <ArrowDown size={20} />}
                                    </div>
                                    <div>
                                        <p className="text-white font-medium">{t.description || 'Sem descrição'}</p>
                                        <p className="text-xs text-slate-500">{format(new Date(t.date), 'dd/MM/yyyy')}</p>
                                    </div>
                                </div>
                                <span className={`font-bold ${t.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {t.type === 'income' ? '+' : '-'} R$ {Number(t.amount).toFixed(2)}
                                </span>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <TransactionModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchData}
            />
        </div>
    )
}
