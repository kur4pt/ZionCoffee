import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Lock } from "lucide-react";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const success = await login(password);
      if (!success) {
        setError("Incorrect password. Please try again.");
      }
    } catch (err) {
      setError("An error occurred during login. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-2xl border border-stone-200 p-8 shadow-xl flex flex-col items-center">
        
        {/* Coffee Bean Logo */}
        <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mb-4 border border-stone-200">
          <img src="/coffee-bean.png" alt="Zion Coffee" className="w-10 h-10 object-contain" />
        </div>

        <h1 className="font-meddon text-3xl font-bold text-stone-800 mb-1 py-4">
          Zion Coffee
        </h1>
        <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-6">
          Staff Access Only
        </p>

        <form onSubmit={handleSubmit} className="w-full space-y-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-stone-500 block mb-2">
              Passcode
            </label>
            <div className="relative">
              <input
                type="password"
                placeholder="Enter password..."
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                disabled={isLoading}
                className="w-full pl-10 pr-4 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-900 transition-all disabled:bg-stone-50"
                autoFocus
              />
              <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
            </div>
          </div>

          {error && (
            <p className="text-xs text-rose-600 font-semibold text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={isLoading || !password.trim()}
            className="w-full bg-stone-900 hover:bg-amber-900 disabled:bg-stone-300 text-white font-bold py-3 rounded-xl transition-colors shadow-md text-sm flex items-center justify-center gap-2"
          >
            {isLoading ? "Verifying..." : "Unlock Application"}
          </button>
        </form>
      </div>
    </div>
  );
}