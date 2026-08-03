import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { Spinner, Center } from '@chakra-ui/react';
import DashboardLayout from './components/layout/DashboardLayout';
import Login from './pages/Login';
import Cycles from './pages/Cycles';
import CreateCycle from './pages/CreateCycle';
import CycleDetail from './pages/CycleDetail';
import Depenses from './pages/Depenses';
import Parametrage from './pages/Parametrage';
import Ventes from './pages/Ventes';
import Clients from './pages/Clients';
import ClientDetail from './pages/ClientDetail';
import Dashboard from './pages/Dashboard';
import Risques from './pages/Risques';
import Stocks from './pages/Stocks';
import ProduitsVeterinaires from './pages/ProduitsVeterinaires';
import Sante from './pages/Sante';
import Bilans from './pages/Bilans';
import Cloture from './pages/Cloture';
import Utilisateurs from './pages/Utilisateurs';
import Validations from './pages/Validations';
import RapportPreview from './pages/RapportPreview';
import FacturePreview from './pages/FacturePreview';
import FactureGroupeePreview from './pages/FactureGroupeePreview';
import NotFound from './pages/NotFound';

function ProtectedRoute() {
  const { token, loading } = useAuth();

  if (loading) {
    return (
      <Center h="100vh">
        <Spinner size="xl" color="accent.1" />
      </Center>
    );
  }

  if (!token) return <Navigate to="/login" replace />;
  return <DashboardLayout />;
}

function AdminRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Center h="100vh">
        <Spinner size="xl" color="accent.1" />
      </Center>
    );
  }

  if (!user || user.role !== 'admin') return <Navigate to="/cycles" replace />;
  return <DashboardLayout />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/cycles" element={<Cycles />} />
        <Route path="/cycles/nouveau" element={<CreateCycle />} />
        <Route path="/cycles/:id" element={<CycleDetail />} />
        <Route path="/parametrage" element={<Parametrage />} />
        <Route path="/depenses" element={<Depenses />} />
        <Route path="/ventes/:cycleId?" element={<Ventes />} />
        <Route path="/clients" element={<Clients />} />
        <Route path="/clients/:id" element={<ClientDetail />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/risques" element={<Risques />} />
        <Route path="/stocks" element={<Stocks />} />
        <Route path="/produits-veterinaires" element={<ProduitsVeterinaires />} />
        <Route path="/sante" element={<Sante />} />
        <Route path="/bilans" element={<Bilans />} />
        <Route path="/cycles/:id/cloture" element={<Cloture />} />
        <Route path="/a-valider" element={<Validations />} />
        <Route path="/cycles/:id/rapport" element={<RapportPreview />} />
        <Route path="/ventes/:id/facture" element={<FacturePreview />} />
        <Route path="/clients/:clientId/cycles/:cycleId/facture" element={<FactureGroupeePreview />} />
      </Route>
      <Route element={<AdminRoute />}>
        <Route path="/utilisateurs" element={<Utilisateurs />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
