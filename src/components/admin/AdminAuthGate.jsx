import React, { useState } from "react";
import AdminLayout from "./AdminLayout";

export default function AdminAuthGate({ setActiveMainTab }) {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => sessionStorage.getItem("admin_authenticated") === "true"
  );
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // Pulls password from .env file
  const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD;

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      sessionStorage.setItem("admin_authenticated", "true");
      setError("");
    } else {
      setError("Incorrect admin password. Please try again.");
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem("admin_authenticated");
    if (setActiveMainTab) {
      setActiveMainTab("queue");
    }
  };

  if (isAuthenticated) {
    return <AdminLayout setActiveMainTab={setActiveMainTab} onLogout={handleLogout} />;
  }

  return (
    <div className="min-h-screen bg-stone-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-amber-100 text-amber-900 rounded-full flex items-center justify-center mx-auto text-2xl">
            🔒
          </div>
          <h2 className="text-2xl font-bold text-stone-800">Admin Authentication</h2>
          <p className="text-xs text-stone-500">
            Enter the master portal password to access administrative controls.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-stone-600 uppercase mb-1">
              Admin Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border rounded-xl font-mono text-center text-lg focus:ring-2 focus:ring-amber-900 outline-none"
              autoFocus
            />
          </div>

          {error && (
            <p className="text-xs text-red-600 font-bold text-center">{error}</p>
          )}

          <button
            type="submit"
            className="w-full bg-amber-900 hover:bg-amber-800 text-white font-bold py-3 rounded-xl shadow-md transition-colors"
          >
            Unlock Portal
          </button>
        </form>
      </div>
    </div>
  );
}