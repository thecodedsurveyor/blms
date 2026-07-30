export type ApiEnvelope<T> = { data: T; error: null | { code: string; message: string } };
export type User = { id: string; username: string; fullName: string; role: "CITIZEN" | "GOVERNMENT_OFFICER" | "ADMIN"; organisation: "CitizenOrg" | "GovernmentOrg"; nin: string; fabricIdentityLabel: string; active: boolean };
export type Land = { propertyId: string; parcelNumber: string; titleNumber: string; ownerNinRef: string; ownerName: string; state: string; lga: string; address: string; latitude: number; longitude: number; sizeSqM: number; assessedValueKobo: number; askingPriceKobo: number; outstandingLevyKobo: number; documentCid: string | null; documentName: string | null; status: string; listedForSale: boolean; createdAt: string; updatedAt: string; version: number };
export type Transaction = { id: string; propertyId: string; action: string; from?: string; to?: string; amountKobo?: number; timestamp: string; status: string; detail: string };

export const API_BASE = String(import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
export const isOfflineDemo = !API_BASE;
export async function api<T>(path: string, init?: RequestInit): Promise<T> { if (isOfflineDemo) return localDemoRequest<T>(path, init); const isFormData = typeof FormData !== "undefined" && init?.body instanceof FormData; const response = await fetch(`${API_BASE}${path}`, { credentials: "include", headers: { ...(isFormData ? {} : { "Content-Type": "application/json" }), ...(init?.headers || {}) }, ...init }); const body = await response.json() as ApiEnvelope<T>; if (!response.ok) throw new Error(body.error?.message || "Request failed"); return body.data; }
import { localDemoRequest } from "./localDemo";
