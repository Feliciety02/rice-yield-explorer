import type {
  SimulationExecuteRequest,
  SimulationListResponse,
  SimulationResponse,
  SimulationSummary,
} from "@/types/simulation";

const DEFAULT_API_BASE_URL = "";

function getApiBaseUrl(): string {
  const configured = import.meta.env.VITE_API_BASE_URL as string | undefined;
  if (configured?.trim()) {
    return configured.trim().replace(/\/$/, "");
  }
  return DEFAULT_API_BASE_URL;
}

async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const contentType = response.headers.get("content-type") ?? "";
  const data = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const detail =
      typeof data === "object" && data && "detail" in data
        ? String((data as { detail?: string }).detail)
        : response.statusText;
    throw new Error(detail || "Request failed");
  }

  return data as T;
}

export async function runSimulation(
  payload: SimulationExecuteRequest
): Promise<SimulationResponse> {
  return apiRequest<SimulationResponse>("/api/simulations/run", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function listSimulations(
  limit: number,
  offset: number
): Promise<SimulationListResponse> {
  const query = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  });
  return apiRequest<SimulationListResponse>(`/api/simulations?${query.toString()}`);
}

export async function renameSimulation(
  id: string,
  name: string
): Promise<SimulationSummary> {
  return apiRequest<SimulationSummary>(`/api/simulations/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ name }),
  });
}

export async function deleteSimulation(id: string): Promise<void> {
  await apiRequest<void>(`/api/simulations/${id}`, {
    method: "DELETE",
  });
}

export async function clearSimulations(): Promise<void> {
  await apiRequest<void>("/api/simulations", {
    method: "DELETE",
  });
}
