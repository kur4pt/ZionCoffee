import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import PillSideNav from "./components/PillSideNav";
import LoginPage from "./components/LoginPage";
import AdminAuthGate from "./components/admin/AdminAuthGate";

// Page Imports
import CreateOrder from "./components/CreateOrder";
import OrderQueue from "./components/OrderQueue";
import PreviousOrder from "./components/PreviousOrder";

function AuthenticatedApp() {
  const { isAuthenticated } = useAuth();

  // Redirect to login screen if not authenticated
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900 flex flex-col md:flex-row">
      <PillSideNav />

      <main className="flex-1 pt-20 md:pt-6 pl-4 md:pl-28 pr-4 md:pr-6 py-6 min-h-screen">
        <Routes>
          <Route path="/" element={<Navigate to="/CreateOrder" replace />} />
          <Route path="/CreateOrder" element={<CreateOrder />} />
          <Route path="/OrderQueue" element={<OrderQueue />} />
          <Route path="/PreviousOrder" element={<PreviousOrder />} />
          <Route path="/AdminPage" element={<AdminAuthGate />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AuthenticatedApp />
    </AuthProvider>
  );
}