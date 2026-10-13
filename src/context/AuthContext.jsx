import React, { createContext, useContext, useState } from "react";
import { supabase } from "../supabaseClient";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [authRole, setAuthRole] = useState(() => {
    return localStorage.getItem("app_auth_role") || null;
  });

  const login = async (password) => {
    try {
      const { data, error } = await supabase
        .from("app_settings")
        .select("role")
        .eq("password", password)
        .single();

      if (error || !data) {
        return false;
      }

      localStorage.setItem("app_auth_role", data.role);
      setAuthRole(data.role);
      return data.role;
    } catch (err) {
      console.error("Login error:", err.message);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem("app_auth_role");
    setAuthRole(null);
  };

  return (
    <AuthContext.Provider value={{ authRole, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}