import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

import api from "../lib/axios";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  /* ========================================
     LOGIN
  ========================================= */

  const login = async (data) => {
    try {
      setLoading(true);

      // API CALL LATER

      const response = await api.post("/auth/login", data);

      setUser(response.data.data);
    } catch (error) {
      console.error(error);

      throw error;
    } finally {
      setLoading(false);
    }
  };

  /* ========================================
     LOGOUT
  ========================================= */

  const logout = async () => {
    try {
      await api.post("/auth/logout");

      setUser(null);
    } catch (error) {
      console.error(error);
    }
  };

  /* ========================================
   REGISTER
======================================== */

  const register = async (data) => {
    try {
      setLoading(true);

      // API CALL LATER

      const response = await api.post("/auth/register", data);

      setUser(response.data.data);
    } catch (error) {
      setUser(null);
      if (error.response?.status !== 401) {
        console.log(error);
      }

      throw error;
    } finally {
      setLoading(false);
    }
  };

  const checkAuth = async () => {
    try {
      const response = await api.get("/auth/me");

      setUser(response.data.user);
    } catch (error) {
      console.log(error);
      setUser(null);
    } finally {
      setAuthLoading(false);
    }
  };
  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,

        setUser,

        loading,

        login,

        logout,

        register,

        authLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
