import api from "../../lib/axios";

export const uploadImage = async (file, folder) => {
  const formData = new FormData();
  formData.append("image", file);
  formData.append("folder", folder);

  const response = await api.post("/upload/image", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data.data;
};
