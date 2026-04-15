import { api } from "./client.js";

export async function register(payload) {
  const { data } = await api.post("/auth/register", payload);
  return data;
}

export async function login(payload) {
  const { data } = await api.post("/auth/login", payload);
  return data;
}

export async function fetchMe() {
  const { data } = await api.get("/auth/me");
  return data;
}

export async function updateProfile(payload) {
  const { data } = await api.put("/auth/profile", payload);
  return data;
}

export async function updatePassword(payload) {
  const { data } = await api.put("/auth/password", payload);
  return data;
}

export async function askAssistant(payload) {
  const { data } = await api.post("/assistant/chat", payload);
  return data;
}
