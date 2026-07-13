import api from "../../lib/axios";

export const getCertificates = async () => {
  const response = await api.get("/certificates");

  return response.data.data;
};

export const createCertificate = async (data) => {
  const response = await api.post("/certificates", data);

  return response.data.data;
};

export const updateCertificate = async (id, data) => {
  const response = await api.put(`/certificates/${id}`, data);

  return response.data.data;
};

export const deleteCertificate = async (id) => {
  const response = await api.delete(`/certificates/${id}`);

  return response.data.data;
};
