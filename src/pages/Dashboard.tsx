import { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { ArrowUp, ArrowDown, Wallet, Plus, BarChart3, Bell } from 'lucide-react';
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

    // Notifications State
    const [notifications, setNotifications] = useState<any[]>([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

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
            setRecentTransactions(transactions.slice(0, 50)); // Get more for scrolling list
        }

        // Fetch Notifications (Recurring Expenses Due)
        const { data: recurring } = await supabase
            .from('recurring_expenses')
            .select('*')
            .eq('active', true);

        if (recurring) {
            const today = new Date();
            const currentDay = today.getDate();
            const alerts: any[] = [];

            recurring.forEach(rec => {
                const dueDay = rec.day_of_month;
                // Check if due today
                if (dueDay === currentDay) {
                    alerts.push({
                        id: `due-today-${rec.id}`,
                        title: 'Vence Hoje!',
                        message: `A conta "${rec.title}" no valor de R$ ${rec.amount.toFixed(2)} vence hoje.`,
                        type: 'urgent'
                    });
                }
                // Check if due in 1-3 days
                else if (dueDay > currentDay && dueDay <= currentDay + 3) {
                    alerts.push({
                        id: `due-soon-${rec.id}`,
                        title: 'Vence em Breve',
                        message: `"${rec.title}" vence dia ${dueDay}.`,
                        type: 'warning'
                    });
                }
            });

            setNotifications(alerts);
            setUnreadCount(alerts.length);
        }

        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, [user]);

    return (
        <div className="flex flex-col h-[calc(100vh-2rem)] md:h-[calc(100vh-4rem)] gap-4 overflow-hidden">
            {/* Header Compacto */}
            <header className="flex justify-between items-center shrink-0">
                <div>
                    <h2 className="text-2xl font-bold text-white leading-tight">Visão Geral</h2>
                    <p className="text-slate-400 text-sm">Olá, {user?.user_metadata?.full_name?.split(' ')[0] || 'Gestor'}.</p>
                </div>

                <div className="flex items-center gap-3">
                    {/* Botão de Notificação */}
                    <div className="relative">
                        <button
                            onClick={() => setShowNotifications(!showNotifications)}
                            className="p-2.5 rounded-xl bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 hover:text-white transition-all relative border border-white/5"
                        >
                            <Bell size={20} />
                            {unreadCount > 0 && (
                                <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]"></span>
                            )}
                        </button>

                        {/* Dropdown de Notificações */}
                        {showNotifications && (
                            <>
                                <div
                                    className="fixed inset-0 z-40"
                                    onClick={() => setShowNotifications(false)}
                                ></div>
                                <div className="absolute right-0 top-full mt-2 w-80 bg-[#1e293b] border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden animate-fade-in origin-top-right">
                                    <div className="p-3 border-b border-slate-700 bg-slate-900/50 flex justify-between items-center">
                                        <h4 className="font-semibold text-white text-sm">Notificações</h4>
                                        <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full">{notifications.length}</span>
                                    </div>
                                    <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                                        {notifications.length === 0 ? (
                                            <div className="p-8 text-center text-slate-500 text-sm">
                                                Tudo tranquilo por aqui! 🎉
                                            </div>
                                        ) : (
                                            notifications.map(notif => (
                                                <div key={notif.id} className="p-3 border-b border-slate-700/50 hover:bg-white/5 transition-colors">
                                                    <div className="flex items-start gap-3">
                                                        <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${notif.type === 'urgent' ? 'bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.5)]' : 'bg-amber-500'}`} />
                                                        <div>
                                                            <p className={`text-sm font-semibold ${notif.type === 'urgent' ? 'text-red-400' : 'text-amber-400'}`}>
                                                                {notif.title}
                                                            </p>
                                                            <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                                                                {notif.message}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="bg-purple-600 hover:bg-purple-700 text-white p-2.5 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20 active:scale-95 transition-all gap-2 px-4"
                    >
                        <Plus size={20} />
                        <span className="hidden sm:inline font-medium text-sm">Nova</span>
                    </button>
                </div>
            </header>

            {/* Cards de Resumo - Row 1 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
                <div className="glass p-5 rounded-2xl border-t-4 border-t-purple-500 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Wallet size={48} />
                    </div>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Saldo Total</p>
                    <h3 className="text-2xl font-bold text-white">
                        R$ {balance.total.toFixed(2)}
                    </h3>
                </div>

                <div className="glass p-5 rounded-2xl border-t-4 border-t-emerald-500 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-emerald-500">
                        <ArrowUp size={48} />
                    </div>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Receitas</p>
                    <h3 className="text-emerald-400 text-2xl font-bold">
                        R$ {balance.income.toFixed(2)}
                    </h3>
                </div>

                <div className="glass p-5 rounded-2xl border-t-4 border-t-red-500 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-red-500">
                        <ArrowDown size={48} />
                    </div>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Despesas</p>
                    <h3 className="text-red-400 text-2xl font-bold">
                        R$ {balance.expense.toFixed(2)}
                    </h3>
                </div>
            </div>

            {/* Área Principal - Row 2 (Estica para preencher o resto) */}
            <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-3 gap-4 pb-1">
                {/* Coluna do Gráfico (2/3) */}
                <div className="glass p-5 rounded-2xl lg:col-span-2 flex flex-col min-h-[300px]">
                    <div className="flex items-center gap-2 mb-4 shrink-0">
                        <BarChart3 className="text-purple-400" size={20} />
                        <h3 className="text-lg font-bold text-white">Fluxo Financeiro</h3>
                    </div>
                    <div className="flex-1 w-full min-h-0 relative">
                        <div className="absolute inset-0">
                            <FinancialChart transactions={allTransactions} />
                        </div>
                    </div>
                </div>

                {/* Coluna de Transações (1/3) */}
                <div className="glass p-0 rounded-2xl flex flex-col min-h-[300px] overflow-hidden">
                    <div className="p-5 border-b border-white/5 bg-slate-800/20 backdrop-blur-md sticky top-0 z-10">
                        <h3 className="text-lg font-bold text-white">Recentes</h3>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
                        {loading ? (
                            <p className="text-slate-500 text-center text-sm py-4">Carregando...</p>
                        ) : recentTransactions.length === 0 ? (
                            <p className="text-slate-500 text-center text-sm py-4">Nenhuma transação recente.</p>
                        ) : (
                            recentTransactions.map(t => (
                                <div key={t.id} className="flex items-center justify-between p-3 bg-slate-800/40 rounded-xl hover:bg-slate-700/40 transition-all border border-transparent hover:border-slate-600/30 group">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${t.type === 'income' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                                            {t.type === 'income' ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-slate-200 font-medium text-sm truncate pr-2 group-hover:text-white transition-colors">
                                                {t.description || 'Sem descrição'}
                                            </p>
                                            <p className="text-[10px] text-slate-500 uppercase tracking-wide">
                                                {format(t.date.split('T')[0].split('-').map(Number).join('/'), 'dd/MM')}
                                            </p>
                                        </div>
                                    </div>
                                    <span className={`text-sm font-bold whitespace-nowrap ${t.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {t.type === 'income' ? '+' : '-'} {Number(t.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
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
