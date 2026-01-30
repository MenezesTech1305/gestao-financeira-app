import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Transaction {
    amount: number;
    type: 'income' | 'expense';
    date: string;
}

interface FinancialChartProps {
    transactions: Transaction[];
}

export const FinancialChart = ({ transactions }: FinancialChartProps) => {
    const data = useMemo(() => {
        // Group by date and calculate balance per day
        const grouped = transactions.reduce((acc, curr) => {
            const date = curr.date;
            if (!acc[date]) {
                acc[date] = { date, income: 0, expense: 0 };
            }
            if (curr.type === 'income') acc[date].income += Number(curr.amount);
            else acc[date].expense += Number(curr.amount);
            return acc;
        }, {} as Record<string, { date: string; income: number; expense: number }>);

        // Convert to array and sort by date. Take last 7 days or so.
        return Object.values(grouped)
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .slice(-7); // Last 7 active days for simplicity
    }, [transactions]);

    if (data.length === 0) {
        return (
            <div className="h-[300px] flex items-center justify-center text-slate-500">
                Sem dados suficientes para o gráfico.
            </div>
        )
    }

    return (
        <div className="h-[300px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                    <defs>
                        <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis
                        dataKey="date"
                        stroke="#94a3b8"
                        tickFormatter={(value) => new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                    />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip
                        contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                        itemStyle={{ color: '#f8fafc' }}
                    />
                    <Area type="monotone" dataKey="income" stroke="#10b981" fillOpacity={1} fill="url(#colorIncome)" name="Receitas" />
                    <Area type="monotone" dataKey="expense" stroke="#ef4444" fillOpacity={1} fill="url(#colorExpense)" name="Despesas" />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};
