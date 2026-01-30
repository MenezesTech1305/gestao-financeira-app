import { useEffect, useState } from 'react';
import { Plus, Target, Trash2, Edit2, TrendingUp } from 'lucide-react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { GoalModal } from '../components/GoalModal';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Goal {
    id: string;
    title: string;
    target_amount: number;
    current_amount: number;
    deadline: string | null;
    color: string;
}

export function Goals() {
    const { user } = useAuth();
    const [goals, setGoals] = useState<Goal[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingGoal, setEditingGoal] = useState<Goal | undefined>(undefined);

    const fetchGoals = async () => {
        try {
            if (!user) return;

            const { data, error } = await supabase
                .from('goals')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setGoals(data || []);
        } catch (error) {
            console.error('Erro ao buscar metas:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGoals();
    }, [user]);

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir esta meta?')) return;

        try {
            const { error } = await supabase.from('goals').delete().eq('id', id);
            if (error) throw error;
            fetchGoals();
        } catch (error) {
            alert('Erro ao excluir meta');
        }
    };

    const calculateProgress = (curr: number, target: number) => {
        return Math.min(Math.round((curr / target) * 100), 100);
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Metas Financeiras</h1>
                    <p className="text-slate-400">Defina objetivos e acompanhe seu progresso.</p>
                </div>
                <button
                    onClick={() => {
                        setEditingGoal(undefined);
                        setIsModalOpen(true);
                    }}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition-all flex items-center gap-2 shadow-lg shadow-purple-500/20"
                >
                    <Plus size={20} />
                    Nova Meta
                </button>
            </div>

            {loading ? (
                <div className="text-center text-slate-400 py-20">Carregando metas...</div>
            ) : goals.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                    <Target size={64} className="mb-4 opacity-50" />
                    <p className="text-lg">Nenhuma meta definida ainda.</p>
                    <p className="text-sm">Clique em "Nova Meta" para começar a economizar!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {goals.map((goal) => {
                        const progress = calculateProgress(goal.current_amount, goal.target_amount);

                        return (
                            <div key={goal.id} className="relative group bg-[#1e293b]/50 backdrop-blur-sm border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-all hover:transform hover:-translate-y-1">
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`p-3 rounded-xl bg-opacity-20`} style={{ backgroundColor: `${goal.color}33` }}>
                                        <Target size={24} style={{ color: goal.color }} />
                                    </div>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => {
                                                setEditingGoal(goal);
                                                setIsModalOpen(true);
                                            }}
                                            className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(goal.id)}
                                            className="p-2 hover:bg-white/10 rounded-lg text-red-400 hover:text-red-300 transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>

                                <h3 className="text-xl font-bold text-white mb-1">{goal.title}</h3>
                                {goal.deadline && (
                                    <p className="text-xs text-slate-400 mb-4">
                                        Alvo: {format(new Date(goal.deadline), "d 'de' MMMM, yyyy", { locale: ptBR })}
                                    </p>
                                )}

                                <div className="space-y-4">
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <p className="text-sm text-slate-400 mb-1">Guardado</p>
                                            <p className="text-lg font-bold text-white">
                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(goal.current_amount)}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm text-slate-400 mb-1">Meta</p>
                                            <p className="text-sm font-medium text-slate-300">
                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(goal.target_amount)}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="relative h-3 w-full bg-slate-700/50 rounded-full overflow-hidden">
                                        <div
                                            className="absolute left-0 top-0 h-full transition-all duration-1000 ease-out rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)]"
                                            style={{ width: `${progress}%`, backgroundColor: goal.color }}
                                        />
                                    </div>

                                    <div className="flex justify-between text-xs font-medium">
                                        <span style={{ color: goal.color }}>{progress}% Concluído</span>
                                        <span className="text-slate-500">
                                            Faltam {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Math.max(0, goal.target_amount - goal.current_amount))}
                                        </span>
                                    </div>
                                </div>

                                {progress >= 100 && (
                                    <div className="absolute inset-x-0 -bottom-3 flex justify-center">
                                        <span className="px-3 py-1 bg-green-500/20 border border-green-500/30 text-green-400 text-xs font-bold rounded-full backdrop-blur-md shadow-lg flex items-center gap-1">
                                            <TrendingUp size={12} />
                                            Meta Atingida!
                                        </span>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {isModalOpen && (
                <GoalModal
                    onClose={() => setIsModalOpen(false)}
                    onSuccess={() => {
                        fetchGoals();
                        setIsModalOpen(false);
                    }}
                    goal={editingGoal}
                />
            )}
        </div>
    );
}
