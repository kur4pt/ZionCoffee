import React, { useState } from "react";
import AdminLayout from "./AdminLayout";
import { useAuth } from "../../context/AuthContext";

export default function AdminAuthGate({ setActiveMainTab }) {
  const { authRole, login, logout } = useAuth();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Check if authenticated user is specifically a manager
  const isAuthenticated = authRole === "manager";

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const role = await login(password);
      if (role === "manager") {
        setError("");
      } else {
        setError("Incorrect manager password. Please try again.");
      }
    } catch (err) {
      setError("An error occurred during authentication.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    if (setActiveMainTab) {
      setActiveMainTab("queue");
    }
  };

  if (isAuthenticated) {
    return (
      <AdminLayout
        setActiveMainTab={setActiveMainTab}
        onLock={handleLogout}
        onLogout={handleLogout}
      />
    );
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
            Enter the master manager password to access administrative controls.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-stone-600 uppercase mb-1">
              Manager Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              className="w-full px-4 py-3 border rounded-xl font-mono text-center text-lg focus:ring-2 focus:ring-amber-900 outline-none disabled:bg-stone-50"
              autoFocus
            />
          </div>

          {error && (
            <p className="text-xs text-red-600 font-bold text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={isLoading || !password.trim()}
            className="w-full bg-amber-900 hover:bg-amber-800 disabled:bg-stone-300 text-white font-bold py-3 rounded-xl shadow-md transition-colors flex items-center justify-center gap-2"
          >
            {isLoading ? "Verifying..." : "Unlock Portal"}
          </button>
        </form>
      </div>
    </div>
  );
}