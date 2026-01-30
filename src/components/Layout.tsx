import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Wallet, PieChart, LogOut, Target, Repeat, Menu, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import clsx from 'clsx';

export const Layout = ({ children }: { children: React.ReactNode }) => {
    const { signOut } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const handleSignOut = async () => {
        await signOut();
        navigate('/login');
    };

    const menuItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
        { icon: Wallet, label: 'Transações', path: '/transactions' },
        { icon: Target, label: 'Metas', path: '/goals' },
        { icon: Repeat, label: 'Contas Fixas', path: '/recurring' },
        { icon: PieChart, label: 'Relatórios', path: '/reports' },
    ];

    return (
    return (
        <div className="min-h-screen custom-bg text-white flex flex-col md:flex-row">
            {/* Mobile Header */}
            <div className="md:hidden flex items-center justify-between p-4 glass sticky top-0 z-50">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                        <span className="font-bold text-xl">$</span>
                    </div>
                    <h1 className="text-xl font-bold tracking-tight">MNZ Gestão</h1>
                </div>
                <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                    {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Sidebar Glassmorphism */}
            <aside className={clsx(
                "fixed md:sticky top-0 h-full w-full md:w-64 glass flex flex-col p-6 z-40 transition-transform duration-300 ease-in-out md:translate-x-0 pt-20 md:pt-6",
                isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="hidden md:flex mb-10 items-center gap-2">
                    <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                        <span className="font-bold text-xl">$</span>
                    </div>
                    <h1 className="text-xl font-bold tracking-tight">MNZ Gestão</h1>
                </div>

                <nav className="flex-1 space-y-2">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;

                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={clsx(
                                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                                    isActive
                                        ? "bg-purple-600/20 text-purple-400 border border-purple-500/30 shadow-[0_0_15px_rgba(139,92,246,0.3)]"
                                        : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                                )}
                            >
                                <Icon size={20} className={clsx("transition-colors", isActive ? "text-purple-400" : "text-slate-500 group-hover:text-slate-300")} />
                                <span className="font-medium">{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                <button
                    onClick={handleSignOut}
                    className="mt-auto flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-red-400 transition-colors"
                >
                    <LogOut size={20} />
                    <span>Sair</span>
                </button>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-4 md:p-8 relative w-full">
                {/* Background Glow Effects */}
                <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
                    <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px]" />
                    <div className="absolute bottom-[-10%] left-[20%] w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[100px]" />
                </div>

                <div className="max-w-7xl mx-auto animate-fade-in">
                    {children}
                </div>
            </main>
        </div>
    );
};
