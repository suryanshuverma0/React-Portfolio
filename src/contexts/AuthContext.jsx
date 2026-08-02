import { createContext, useContext, useState, useEffect } from "react";
import { startAuthentication, startRegistration } from "@simplewebauthn/browser";

const AuthContext = createContext();

import api from "../lib/axios";
import {
  getAuthenticationOptions,
  verifyAuthentication,
  getSignupOptions,
  verifySignup,
} from "../services/public.passkey.service";

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

      return response.data.data;
    } catch (error) {
      console.error(error);

      throw error;
    } finally {
      setLoading(false);
    }
  };

  /* ========================================
     GOOGLE LOGIN
  ========================================= */

  const loginWithGoogle = async (credential) => {
    try {
      setLoading(true);

      const response = await api.post("/google-auth/login", { credential });

      setUser(response.data.data);

      return response.data.data;
    } catch (error) {
      console.error(error);

      throw error;
    } finally {
      setLoading(false);
    }
  };

  /* ========================================
     PASSKEY LOGIN

     Usernameless: the options request needs
     no identifier, the browser's own
     credential picker decides which passkey
     (and therefore which account) is used.
  ========================================= */

  const loginWithPasskey = async () => {
    try {
      setLoading(true);

      const optionsJSON = await getAuthenticationOptions();

      const credentialResponse = await startAuthentication({ optionsJSON });

      const loggedInUser = await verifyAuthentication(credentialResponse);

      setUser(loggedInUser);

      return loggedInUser;
    } catch (error) {
      console.error(error);

      throw error;
    } finally {
      setLoading(false);
    }
  };

  /* ========================================
     PASSKEY SIGNUP

     Creates a brand-new account bound to a
     first passkey (same admin/public-access
     gate as password & Google signup). Only
     succeeds for emails with no existing
     account — adding a passkey to an account
     you already have happens from Security
     Settings while logged in instead.
  ========================================= */

  const registerWithPasskey = async (email) => {
    try {
      setLoading(true);

      const optionsJSON = await getSignupOptions(email);

      const credentialResponse = await startRegistration({ optionsJSON });

      const newUser = await verifySignup(email, credentialResponse);

      setUser(newUser);

      return newUser;
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

      return response.data.data;
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

        loginWithGoogle,

        loginWithPasskey,

        registerWithPasskey,

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
