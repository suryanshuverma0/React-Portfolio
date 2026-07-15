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

export const uploadImages = async (files, folder) => {
  const formData = new FormData();
  Array.from(files).forEach((file) => formData.append("images", file));
  formData.append("folder", folder);

  const response = await api.post("/upload/images", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data.data;
};
