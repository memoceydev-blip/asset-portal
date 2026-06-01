import axios from "axios";
import keycloak from "./auth";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

api.interceptors.request.use((request) => {
  if (keycloak.token) {
    request.headers.Authorization = `Bearer ${keycloak.token}`;
  }
  return request;
});
