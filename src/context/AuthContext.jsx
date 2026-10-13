import React, { createContext, useContext, useState } from "react";

const AuthContext = createContext();

const APP_PASSWORD = import.meta.env.VITE_APP_PASSWORD; 

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem("app_authenticated") === "true";
  });

  const login = (password) => {
    if (password === APP_PASSWORD) {
      localStorage.setItem("app_authenticated", "true");
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  const logout = () => {
    localStorage.removeItem("app_authenticated");
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}