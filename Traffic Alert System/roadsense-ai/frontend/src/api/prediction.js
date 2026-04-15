import { api } from "./client.js";

export async function predictPoint(body) {
  const { data } = await api.post("/predict/point", body);
  return data;
}

export async function predictRoute(body) {
  const { data } = await api.post("/predict/route", body);
  return data;
}

export async function fetchHistory(params) {
  const { data } = await api.get("/history/", { params });
  return data;
}

export async function fetchHistoryItem(id) {
  const { data } = await api.get(`/history/${id}`);
  return data;
}

export async function deleteHistoryItem(id) {
  const { data } = await api.delete(`/history/${id}`);
  return data;
}

export async function fetchHistoryStats() {
  const { data } = await api.get("/history/stats");
  return data;
}

export async function fetchModelInfo() {
  const { data } = await api.get("/ml/model-info");
  return data;
}

export async function fetchHeatmapHistory(limit = 500) {
  return fetchHistory({ page: 1, limit });
}
