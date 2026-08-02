import api from "../../lib/axios";

export const getRegistrationOptions = async () => {
  const response = await api.post("/passkey/registration/options");

  return response.data.data;
};

export const verifyRegistration = async (credentialResponse, name) => {
  const response = await api.post("/passkey/registration/verify", {
    response: credentialResponse,
    name,
  });

  return response.data.data;
};

export const listPasskeys = async () => {
  const response = await api.get("/passkey");

  return response.data.data;
};

export const renamePasskey = async (id, name) => {
  const response = await api.patch(`/passkey/${id}`, { name });

  return response.data.data;
};

export const deletePasskey = async (id) => {
  const response = await api.delete(`/passkey/${id}`);

  return response.data.data;
};
