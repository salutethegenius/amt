import type { ImportableItem, ImportableSearchHit, ImportableTariffRates } from "./types";

const BASE_URL = "https://importable.app";

export class ImportableApiError extends Error {
  constructor(
    message: string,
    public status?: number
  ) {
    super(message);
    this.name = "ImportableApiError";
  }
}

function apiToken(): string {
  const token = process.env.IMPORTABLE_API_KEY;
  if (!token) {
    throw new ImportableApiError("IMPORTABLE_API_KEY is not set", 500);
  }
  return token;
}

async function importableGet<T>(path: string): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${apiToken()}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  const text = await response.text();
  let body: unknown = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      throw new ImportableApiError("Importable returned invalid JSON", response.status);
    }
  }

  if (!response.ok) {
    const message =
      body && typeof body === "object" && "message" in body && typeof body.message === "string"
        ? body.message
        : "Importable request failed";
    throw new ImportableApiError(message, response.status);
  }

  return body as T;
}

interface JsonApiList {
  data?: Array<{
    id?: string | null;
    attributes?: { description?: string; attributes?: string | null };
  }>;
}

interface JsonApiItem {
  data?: {
    id?: string | null;
    attributes?: {
      description?: string;
      attributes?: string | null;
      tariff?: ImportableTariffRates;
    };
  };
}

export async function searchImportableItems(query: string): Promise<ImportableSearchHit[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const json = await importableGet<JsonApiList>(`/api/v1/search?q=${encodeURIComponent(q)}`);
  return (json.data ?? [])
    .filter((row) => typeof row.id === "string" && row.id.length > 0)
    .map((row) => ({
      id: row.id as string,
      description: row.attributes?.description ?? "Untitled item",
      attributes: row.attributes?.attributes ?? null,
    }));
}

export async function getImportableItem(id: string): Promise<ImportableItem> {
  const json = await importableGet<JsonApiItem>(`/api/v1/items/${encodeURIComponent(id)}`);
  const row = json.data;
  const tariff = row?.attributes?.tariff;
  if (!row?.id || !tariff?.code) {
    throw new ImportableApiError("No item for the id provided.", 404);
  }
  return {
    id: row.id,
    description: row.attributes?.description ?? "Untitled item",
    attributes: row.attributes?.attributes ?? null,
    tariff,
  };
}
