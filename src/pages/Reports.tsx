import { useEffect, useState } from 'react';
import { Download, FileText, PieChart as PieChartIcon } from 'lucide-react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
    Legend
} from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

export function Reports() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any[]>([]);
    const [rawData, setRawData] = useState<any[]>([]);
    const [month, setMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM

    useEffect(() => {
        fetchData();
    }, [user, month]);

    const fetchData = async () => {
        try {
            if (!user) return;
            setLoading(true);

            const [year, monthNum] = month.split('-');
            const startDate = `${year}-${monthNum}-01`;
            const endDate = new Date(parseInt(year), parseInt(monthNum), 0).toISOString().split('T')[0];

            const { data: transactions, error } = await supabase
                .from('transactions')
                .select(`
          *,
          categories (name)
        `)
                .eq('user_id', user.id)
                .eq('type', 'expense')
                .gte('date', startDate)
                .lte('date', endDate);

            if (error) throw error;

            setRawData(transactions || []);

            // Agrupar por categoria para o gráfico
            const grouped = transactions?.reduce((acc: any, curr: any) => {
                const catName = curr.categories?.name || 'Sem Categoria';
                acc[catName] = (acc[catName] || 0) + Number(curr.amount);
                return acc;
            }, {});

            const chartData = Object.entries(grouped || {}).map(([name, value]) => ({
                name,
                value
            }));

            setData(chartData);
        } catch (error) {
            console.error('Erro ao buscar relatórios:', error);
        } finally {
            setLoading(false);
        }
    };

    const exportPDF = () => {
        const doc = new jsPDF();

        // Header
        doc.setFontSize(20);
        doc.text('Relatório Financeiro Mensal', 14, 22);

        doc.setFontSize(12);
        doc.text(`Período: ${month}`, 14, 30);
        doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 36);

        // Dados da Tabela
        const tableData = rawData.map(item => [
            item.date.split('T')[0].split('-').reverse().join('/'),
            item.description,
            item.categories?.name || '-',
            new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.amount)
        ]);

        // Calcular total
        const total = rawData.reduce((acc, curr) => acc + Number(curr.amount), 0);
        tableData.push(['', '', 'TOTAL', new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total)]);

        autoTable(doc, {
            startY: 44,
            head: [['Data', 'Descrição', 'Categoria', 'Valor']],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: [139, 92, 246] }, // Cor Roxa
            footStyles: { fillColor: [30, 41, 59] },
        });

        doc.save(`relatorio_${month}.pdf`);
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Relatórios e Análises</h1>
                    <p className="text-slate-400">Visualize seus gastos por categoria.</p>
                </div>

                <div className="flex items-center gap-4">
                    <input
                        type="month"
                        value={month}
                        onChange={(e) => setMonth(e.target.value)}
                        className="bg-slate-900/50 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all [color-scheme:dark]"
                    />
                    <button
                        onClick={exportPDF}
                        disabled={rawData.length === 0}
                        className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Download size={20} />
                        <span className="hidden md:inline">Exportar PDF</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Card do Gráfico */}
                <div className="bg-[#1e293b]/50 backdrop-blur-sm border border-white/5 rounded-2xl p-6 min-h-[400px] flex flex-col">
                    <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <PieChartIcon size={20} className="text-purple-400" />
                        Despesas por Categoria
                    </h2>

                    {loading ? (
                        <div className="flex-1 flex items-center justify-center text-slate-400">Carregando...</div>
                    ) : data.length === 0 ? (
                        <div className="flex-1 flex items-center justify-center text-slate-400">Sem dados neste mês</div>
                    ) : (
                        <div className="flex-1">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={data}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        outerRadius={120}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {data.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(value: number | undefined) => [new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0), 'Valor']}
                                        contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                                    />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>

                {/* Resumo em Texto */}
                <div className="bg-[#1e293b]/50 backdrop-blur-sm border border-white/5 rounded-2xl p-6">
                    <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <FileText size={20} className="text-blue-400" />
                        Resumo do Mês
                    </h2>

                    {loading ? (
                        <div className="py-10 text-center text-slate-400">Carregando...</div>
                    ) : data.length === 0 ? (
                        <div className="py-10 text-center text-slate-400">Nenhum gasto registrado.</div>
                    ) : (
                        <div className="space-y-4">
                            {data.sort((a, b) => b.value - a.value).map((item, index) => (
                                <div key={index} className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                        <span className="text-white font-medium">{item.name}</span>
                                    </div>
                                    <span className="text-slate-300">
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.value)}
                                    </span>
                                </div>
                            ))}

                            <div className="mt-8 pt-4 border-t border-white/10 flex justify-between items-center px-3">
                                <span className="text-lg font-bold text-white">Total</span>
                                <span className="text-xl font-bold text-purple-400">
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(rawData.reduce((acc, curr) => acc + Number(curr.amount), 0))}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
