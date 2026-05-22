import axios from "axios";
import keycloak from "./auth";

const config = window.APP_CONFIG;

export const api = axios.create({
  baseURL: config.API_BASE_URL,
});

api.interceptors.request.use((request) => {
  if (keycloak.token) {
    request.headers.Authorization = `Bearer ${keycloak.token}`;
  }
  return request;
});
