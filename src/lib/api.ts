import type {
  CompareRequest,
  CompareResponse,
  Scenario,
  SimulateRequest,
  SimulateResponse,
  SimulationListResponse,
  SimulationSummary,
  YieldByRainfall,
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
  payload: SimulateRequest
): Promise<SimulateResponse> {
  return apiRequest<SimulateResponse>("/api/simulate", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function compareScenarios(
  payload: CompareRequest
): Promise<CompareResponse> {
  return apiRequest<CompareResponse>("/api/compare", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export type SimulationListOptions = {
  sortBy?: "created_at" | "average_yield";
  sortOrder?: "asc" | "desc";
  scenarioId?: number;
  minAvgYield?: number;
  maxAvgYield?: number;
  createdAfter?: string;
  createdBefore?: string;
};

export async function listSimulations(
  limit: number,
  offset: number,
  options: SimulationListOptions = {}
): Promise<SimulationListResponse> {
  const query = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  });
  if (options.sortBy) {
    query.set("sort_by", options.sortBy);
  }
  if (options.sortOrder) {
    query.set("sort_order", options.sortOrder);
  }
  if (options.scenarioId !== undefined) {
    query.set("scenario_id", String(options.scenarioId));
  }
  if (options.minAvgYield !== undefined) {
    query.set("min_avg_yield", String(options.minAvgYield));
  }
  if (options.maxAvgYield !== undefined) {
    query.set("max_avg_yield", String(options.maxAvgYield));
  }
  if (options.createdAfter) {
    query.set("created_after", options.createdAfter);
  }
  if (options.createdBefore) {
    query.set("created_before", options.createdBefore);
  }
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

export async function listScenarios(): Promise<Scenario[]> {
  return apiRequest<Scenario[]>("/api/scenarios");
}

export async function getYieldByRainfall(): Promise<YieldByRainfall> {
  return apiRequest<YieldByRainfall>("/api/yield-by-rainfall");
}
