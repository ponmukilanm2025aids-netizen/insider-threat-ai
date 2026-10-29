import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { MainLayout } from './layouts/MainLayout';

// Pages
import { LoginPage } from './pages/auth/LoginPage';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { PatientsPage } from './pages/patients/PatientsPage';
import { DoctorsTherapistsPage } from './pages/doctors/DoctorsTherapistsPage';
import { TherapiesCatalogPage } from './pages/therapies/TherapiesCatalogPage';
import { AppointmentsPage } from './pages/appointments/AppointmentsPage';
import { TreatmentProgressPage } from './pages/progress/TreatmentProgressPage';
import { PrescriptionsPage } from './pages/prescriptions/PrescriptionsPage';
import { DietPlansPage } from './pages/diet/DietPlansPage';
import { BillingPage } from './pages/billing/BillingPage';
import { InventoryPage } from './pages/inventory/InventoryPage';
import { ReportsPage } from './pages/reports/ReportsPage';
import { NotificationsPage } from './pages/notifications/NotificationsPage';
import { SettingsPage } from './pages/settings/SettingsPage';

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Main Application Routes */}
          <Route element={<MainLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/patients" element={<PatientsPage />} />
            <Route path="/doctors" element={<DoctorsTherapistsPage />} />
            <Route path="/therapists" element={<DoctorsTherapistsPage />} />
            <Route path="/therapies" element={<TherapiesCatalogPage />} />
            <Route path="/appointments" element={<AppointmentsPage />} />
            <Route path="/treatment-progress" element={<TreatmentProgressPage />} />
            <Route path="/prescriptions" element={<PrescriptionsPage />} />
            <Route path="/diet-plans" element={<DietPlansPage />} />
            <Route path="/billing" element={<BillingPage />} />
            <Route path="/inventory" element={<InventoryPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>

          {/* Fallbacks */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
