import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { Transactions } from './pages/Transactions'
import { Goals } from './pages/Goals';
import { Recurring } from './pages/Recurring';
import { Reports } from './pages/Reports';
import { Layout } from './components/Layout';

// Componente para rotas protegidas
const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen bg-[#0f172a] flex items-center justify-center text-white">Carregando...</div>;
  }

  if (!session) {
    return <Navigate to="/login" />;
  }

  return <Layout>{children}</Layout>;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route path="/" element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          } />

          <Route path="/transactions" element={
            <PrivateRoute>
              <Transactions />
            </PrivateRoute>
          } />

          <Route path="/goals" element={
            <PrivateRoute>
              <Goals />
            </PrivateRoute>
          } />

          <Route path="/recurring" element={
            <PrivateRoute>
              <Recurring />
            </PrivateRoute>
          } />

          <Route path="/reports" element={
            <PrivateRoute>
              <Reports />
            </PrivateRoute>
          } />

          {/* Adicionar mais rotas protegidas aqui */}
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
