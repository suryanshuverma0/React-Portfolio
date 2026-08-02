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
