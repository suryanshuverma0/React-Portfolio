import api from "../lib/axios";

export const getAuthenticationOptions = async () => {
  const response = await api.post("/passkey/authentication/options");

  return response.data.data;
};

export const verifyAuthentication = async (credentialResponse) => {
  const response = await api.post("/passkey/authentication/verify", {
    response: credentialResponse,
  });

  return response.data.data;
};

export const getSignupOptions = async (email) => {
  const response = await api.post("/passkey/signup/options", { email });

  return response.data.data;
};

export const verifySignup = async (email, credentialResponse) => {
  const response = await api.post("/passkey/signup/verify", {
    email,
    response: credentialResponse,
  });

  return response.data.data;
};

export const requestPasskeyLink = async (email) => {
  const response = await api.post("/passkey/link/request", { email });

  return response.data;
};

export const getLinkOptions = async (token) => {
  const response = await api.post("/passkey/link/options", { token });

  return response.data.data;
};

export const verifyLink = async (token, credentialResponse) => {
  const response = await api.post("/passkey/link/verify", {
    token,
    response: credentialResponse,
  });

  return response.data.data;
};
