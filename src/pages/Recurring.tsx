import { useEffect, useState } from 'react';
import { Plus, Repeat, Trash2, Edit2, CheckCircle } from 'lucide-react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { RecurringModal } from '../components/RecurringModal';

export function Recurring() {
    const { user } = useAuth();
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<any | undefined>(undefined);

    const fetchItems = async () => {
        try {
            if (!user) return;

            const { data, error } = await supabase
                .from('recurring_expenses')
                .select(`
          *,
          categories (name, type)
        `)
                .order('day_of_month', { ascending: true });

            if (error) throw error;
            setItems(data || []);
        } catch (error) {
            console.error('Erro ao buscar contas:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchItems();
    }, [user]);

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir esta conta recorrente?')) return;

        try {
            const { error } = await supabase.from('recurring_expenses').delete().eq('id', id);
            if (error) throw error;
            fetchItems();
        } catch (error) {
            alert('Erro ao excluir');
        }
    };

    const handleLaunchTransaction = async (item: any) => {
        if (!confirm(`Deseja lançar a despesa "${item.title}" no valor de R$ ${item.amount} hoje?`)) return;

        try {
            const { error } = await supabase.from('transactions').insert({
                user_id: user?.id,
                amount: item.amount,
                type: 'expense',
                category_id: item.category_id,
                description: `[Conta Fixa] ${item.title}`,
                date: new Date().toISOString().split('T')[0]
            });

            if (error) throw error;
            alert('Despesa lançada com sucesso!');
        } catch (error: any) {
            alert('Erro ao lançar: ' + error.message);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Contas Fixas</h1>
                    <p className="text-slate-400">Gerencie suas despesas recorrentes mensais.</p>
                </div>
                <button
                    onClick={() => {
                        setEditingItem(undefined);
                        setIsModalOpen(true);
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all flex items-center gap-2 shadow-lg shadow-blue-500/20"
                >
                    <Plus size={20} />
                    Nova Conta Fixa
                </button>
            </div>

            {loading ? (
                <div className="text-center text-slate-400 py-20">Carregando contas...</div>
            ) : items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                    <Repeat size={64} className="mb-4 opacity-50" />
                    <p className="text-lg">Nenhuma conta fixa cadastrada.</p>
                    <p className="text-sm">Cadastre aluguel, internet, academia, etc.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {items.map((item) => (
                        <div key={item.id} className="bg-[#1e293b]/50 backdrop-blur-sm border border-white/5 rounded-2xl p-5 flex items-center justify-between group hover:border-white/10 transition-all">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 flex flex-col items-center min-w-[60px]">
                                    <span className="text-xs uppercase font-bold text-blue-300">Dia</span>
                                    <span className="text-2xl font-bold">{item.day_of_month}</span>
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">{item.title}</h3>
                                    <div className="flex items-center gap-2 text-sm text-slate-400">
                                        <span className="bg-slate-700/50 px-2 py-0.5 rounded text-slate-300">{item.categories?.name}</span>
                                        <span>•</span>
                                        <span className="text-white font-medium">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.amount)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleLaunchTransaction(item)}
                                    className="p-2 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded-lg transition-colors flex items-center gap-2"
                                    title="Lançar pagamento este mês"
                                >
                                    <CheckCircle size={18} />
                                    <span className="hidden md:inline text-xs font-bold uppercase">Lançar</span>
                                </button>
                                <div className="h-8 w-px bg-white/10 mx-1"></div>
                                <button
                                    onClick={() => {
                                        setEditingItem(item);
                                        setIsModalOpen(true);
                                    }}
                                    className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
                                >
                                    <Edit2 size={18} />
                                </button>
                                <button
                                    onClick={() => handleDelete(item.id)}
                                    className="p-2 hover:bg-white/10 rounded-lg text-red-400 hover:text-red-300 transition-colors"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {isModalOpen && (
                <RecurringModal
                    onClose={() => setIsModalOpen(false)}
                    onSuccess={() => {
                        fetchItems();
                        setIsModalOpen(false);
                    }}
                    expense={editingItem}
                />
            )}
        </div>
    );
}
