import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3000/api/v1",

  withCredentials: true,

  headers: {
    "Content-Type": "application/json",
  },
});

/* ========================================
   RESPONSE INTERCEPTOR
======================================== */

api.interceptors.response.use(
  (response) => {
    return response;
  },

  async (error) => {
    /* UNAUTHORIZED */

    if (error.response?.status === 401) {
      console.log("Unauthorized");

      /*
        logout user
        redirect login
        refresh session
      */
    }

    return Promise.reject(error);
  },
);

export default api;
