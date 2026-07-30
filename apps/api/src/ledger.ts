import crypto from "node:crypto";
import type { AuditEvent, LandAsset, LocalUser, RegisterLandInput, TransactionRecord } from "@blms/shared";
import { unavailable } from "./errors.js";

export interface LedgerService {
  readonly mode: "mock" | "fabric";
  health(): Promise<{ status: "ok" | "unavailable"; mode: string; detail: string }>;
  listLands(query?: string): Promise<LandAsset[]>;
  getLand(propertyId: string): Promise<LandAsset | undefined>;
  getHistory(propertyId: string): Promise<TransactionRecord[]>;
  getProof(propertyId: string): Promise<{ propertyId: string; networkMode: "simulated-fabric" | "fabric"; blockHash: string; txCount: number; latestTransaction: TransactionRecord | null; endorsements: string[]; detail: string }>;
  getMine(user: LocalUser): Promise<LandAsset[]>;
  register(input: RegisterLandInput, user: LocalUser): Promise<LandAsset>;
  listForSale(propertyId: string, askingPriceKobo: number, user: LocalUser): Promise<LandAsset>;
  cancelListing(propertyId: string, user: LocalUser): Promise<LandAsset>;
  purchase(propertyId: string, buyer: LocalUser): Promise<{ land: LandAsset; transaction: TransactionRecord; feeKobo: number; sellerProceedsKobo: number }>;
  updateLevy(propertyId: string, levyKobo: number, user: LocalUser): Promise<LandAsset>;
  attachDocument(propertyId: string, cid: string, filename: string, user: LocalUser): Promise<LandAsset>;
  transactions(): Promise<TransactionRecord[]>;
  audit(): Promise<AuditEvent[]>;
  revenueSummary(): Promise<{ totalRevenueKobo: number; transferCount: number }>;
}

const now = () => new Date().toISOString();
const id = (prefix: string) => `${prefix}-${crypto.randomUUID().slice(0, 8)}`;

const seededProperties = (): LandAsset[] => [
  { propertyId: "PROP-001", parcelNumber: "LAG-IKE-0001", titleNumber: "LND-2024-001", ownerNinRef: "nin-ref-10000000001", ownerName: "Amina Yusuf", state: "Lagos", lga: "Ikeja", address: "14 Alausa Crescent, Ikeja", latitude: 6.6018, longitude: 3.3515, sizeSqM: 620, assessedValueKobo: 18500000000, askingPriceKobo: 24000000000, outstandingLevyKobo: 0, documentCid: null, documentName: null, status: "REGISTERED", listedForSale: true, createdAt: "2026-01-15T09:00:00.000Z", updatedAt: "2026-06-01T10:30:00.000Z", version: 3 },
  { propertyId: "PROP-002", parcelNumber: "ABJ-MAI-0002", titleNumber: "LND-2024-002", ownerNinRef: "nin-ref-10000000001", ownerName: "Amina Yusuf", state: "FCT", lga: "Maitama", address: "8 Agadez Street, Maitama", latitude: 9.0765, longitude: 7.3986, sizeSqM: 900, assessedValueKobo: 42000000000, askingPriceKobo: 0, outstandingLevyKobo: 0, documentCid: null, documentName: null, status: "REGISTERED", listedForSale: false, createdAt: "2026-02-10T09:00:00.000Z", updatedAt: "2026-02-10T09:00:00.000Z", version: 1 },
  { propertyId: "PROP-003", parcelNumber: "KAD-KAD-0003", titleNumber: "LND-2024-003", ownerNinRef: "nin-ref-10000000002", ownerName: "Chinedu Okafor", state: "Kaduna", lga: "Kaduna North", address: "22 Independence Way, Kaduna", latitude: 10.5105, longitude: 7.4165, sizeSqM: 740, assessedValueKobo: 9500000000, askingPriceKobo: 12000000000, outstandingLevyKobo: 85000000, documentCid: null, documentName: null, status: "REGISTERED", listedForSale: true, createdAt: "2026-03-12T09:00:00.000Z", updatedAt: "2026-05-20T10:30:00.000Z", version: 2 },
  { propertyId: "PROP-004", parcelNumber: "RIV-OBI-0004", titleNumber: "LND-2024-004", ownerNinRef: "nin-ref-10000000002", ownerName: "Chinedu Okafor", state: "Rivers", lga: "Obio-Akpor", address: "5 Stadium Road, Port Harcourt", latitude: 4.8156, longitude: 7.0498, sizeSqM: 510, assessedValueKobo: 11200000000, askingPriceKobo: 0, outstandingLevyKobo: 0, documentCid: null, documentName: null, status: "REGISTERED", listedForSale: false, createdAt: "2026-04-08T09:00:00.000Z", updatedAt: "2026-04-08T09:00:00.000Z", version: 1 },
  { propertyId: "PROP-005", parcelNumber: "OYO-IBA-0005", titleNumber: "LND-2024-005", ownerNinRef: "nin-ref-10000000001", ownerName: "Amina Yusuf", state: "Oyo", lga: "Ibadan North", address: "3 Bodija Estate, Ibadan", latitude: 7.4397, longitude: 3.9002, sizeSqM: 680, assessedValueKobo: 7600000000, askingPriceKobo: 0, outstandingLevyKobo: 0, documentCid: null, documentName: null, status: "REGISTERED", listedForSale: false, createdAt: "2026-04-20T09:00:00.000Z", updatedAt: "2026-04-20T09:00:00.000Z", version: 1 }
];

export class MockLedgerService implements LedgerService {
  readonly mode = "mock" as const;
  private lands = seededProperties();
  private readonly txs: TransactionRecord[] = [
    { id: "TX-001", propertyId: "PROP-001", action: "REGISTER_LAND", timestamp: "2026-01-15T09:00:00.000Z", status: "SUCCESS", detail: "Initial registry record created" },
    { id: "TX-002", propertyId: "PROP-001", action: "LIST_PROPERTY", timestamp: "2026-06-01T10:30:00.000Z", status: "SUCCESS", detail: "Listing opened at ₦240,000,000" }
  ];
  private readonly events: AuditEvent[] = [];

  async health() { return { status: "ok" as const, mode: this.mode, detail: "In-memory local demo ledger active" }; }
  async listLands(query = "") { const q = query.toLowerCase(); return this.lands.filter((l) => !q || [l.propertyId, l.parcelNumber, l.titleNumber, l.state, l.lga, l.ownerName, l.status].some((v) => v.toLowerCase().includes(q))); }
  async getLand(propertyId: string) { return this.lands.find((l) => l.propertyId === propertyId); }
  async getHistory(propertyId: string) { return this.txs.filter((t) => t.propertyId === propertyId).sort((a, b) => b.timestamp.localeCompare(a.timestamp)); }
  async getProof(propertyId: string) {
    const land = await this.getLand(propertyId);
    if (!land) throw new Error("Property not found");
    const history = await this.getHistory(propertyId);
    const latestTransaction = history[0] ?? null;
    const blockHash = crypto.createHash("sha256").update(JSON.stringify({ land, history })).digest("hex");
    return {
      propertyId,
      networkMode: "simulated-fabric" as const,
      blockHash,
      txCount: history.length,
      latestTransaction,
      endorsements: ["CitizenOrg.peer0.demo", "GovernmentOrg.peer0.demo"],
      detail: "Deterministic demo proof generated from the local ledger state; use Fabric mode only for a real network"
    };
  }
  async getMine(user: LocalUser) { return this.lands.filter((l) => l.ownerNinRef === `nin-ref-${user.nin}`); }
  async register(input: RegisterLandInput, user: LocalUser) {
    if (this.lands.some((l) => l.parcelNumber === input.parcelNumber || l.titleNumber === input.titleNumber)) throw new Error("A parcel or title number already exists");
    const land: LandAsset = { ...input, propertyId: id("PROP"), ownerNinRef: `nin-ref-${user.nin}`, ownerName: user.fullName, askingPriceKobo: 0, outstandingLevyKobo: 0, documentCid: null, documentName: null, status: "REGISTERED", listedForSale: false, createdAt: now(), updatedAt: now(), version: 1 };
    this.lands.push(land); this.txs.push({ id: id("TX"), propertyId: land.propertyId, action: "REGISTER_LAND", timestamp: now(), status: "SUCCESS", detail: "Land registered in local demo ledger" }); return land;
  }
  async listForSale(propertyId: string, askingPriceKobo: number, user: LocalUser) { const land = await this.getLand(propertyId); if (!land) throw new Error("Property not found"); if (land.ownerNinRef !== `nin-ref-${user.nin}`) throw new Error("Only the current owner can list this property"); if (askingPriceKobo <= 0 || !Number.isInteger(askingPriceKobo)) throw new Error("Asking price must be a positive integer in kobo"); land.askingPriceKobo = askingPriceKobo; land.listedForSale = true; land.updatedAt = now(); land.version++; this.txs.push({ id: id("TX"), propertyId, action: "LIST_PROPERTY", timestamp: now(), status: "SUCCESS", detail: "Property listed for sale" }); return land; }
  async cancelListing(propertyId: string, user: LocalUser) { const land = await this.getLand(propertyId); if (!land) throw new Error("Property not found"); if (land.ownerNinRef !== `nin-ref-${user.nin}`) throw new Error("Only the current owner can cancel this listing"); land.listedForSale = false; land.askingPriceKobo = 0; land.updatedAt = now(); land.version++; this.txs.push({ id: id("TX"), propertyId, action: "CANCEL_LISTING", timestamp: now(), status: "SUCCESS", detail: "Property listing cancelled" }); return land; }
  async purchase(propertyId: string, buyer: LocalUser) { const land = await this.getLand(propertyId); if (!land) throw new Error("Property not found"); if (!land.listedForSale) throw new Error("Property is not listed for sale"); if (land.ownerNinRef === `nin-ref-${buyer.nin}`) throw new Error("The current owner cannot purchase the same property"); const feeKobo = Math.floor(land.askingPriceKobo * 5 / 100); const sellerProceedsKobo = land.askingPriceKobo - feeKobo; const seller = land.ownerName; land.ownerNinRef = `nin-ref-${buyer.nin}`; land.ownerName = buyer.fullName; land.listedForSale = false; land.askingPriceKobo = 0; land.status = "TRANSFERRED"; land.updatedAt = now(); land.version++; const transaction = { id: id("TX"), propertyId, action: "LAND_TRANSFERRED", from: seller, to: buyer.fullName, amountKobo: land.assessedValueKobo, timestamp: now(), status: "SUCCESS" as const, detail: "SIMULATED — NO FUNDS MOVED" }; this.txs.push(transaction); return { land, transaction, feeKobo, sellerProceedsKobo }; }
  async updateLevy(propertyId: string, levyKobo: number, user: LocalUser) { if (user.role !== "GOVERNMENT_OFFICER" && user.role !== "ADMIN") throw new Error("Government authorisation required"); const land = await this.getLand(propertyId); if (!land) throw new Error("Property not found"); if (!Number.isInteger(levyKobo) || levyKobo < 0) throw new Error("Levy must be a non-negative integer in kobo"); land.outstandingLevyKobo = levyKobo; land.updatedAt = now(); land.version++; this.txs.push({ id: id("TX"), propertyId, action: "UPDATE_LEVY", timestamp: now(), status: "SUCCESS", detail: "Government levy updated" }); return land; }
  async attachDocument(propertyId: string, cid: string, filename: string, user: LocalUser) { const land = await this.getLand(propertyId); if (!land) throw new Error("Property not found"); if (land.ownerNinRef !== `nin-ref-${user.nin}` && user.role === "CITIZEN") throw new Error("Only the current owner can attach a land document"); land.documentCid = cid; land.documentName = filename; land.updatedAt = now(); land.version++; this.txs.push({ id: id("TX"), propertyId, action: "DOCUMENT_ATTACHED", timestamp: now(), status: "SUCCESS", detail: "Document CID attached to local record" }); return land; }
  async transactions() { return [...this.txs].sort((a, b) => b.timestamp.localeCompare(a.timestamp)); }
  async audit() { return [...this.events].sort((a, b) => b.timestamp.localeCompare(a.timestamp)); }
  async revenueSummary() { const transfers = this.txs.filter((t) => t.action === "LAND_TRANSFERRED"); return { totalRevenueKobo: transfers.reduce((sum, t) => sum + Math.floor((t.amountKobo ?? 0) * 5 / 100), 0), transferCount: transfers.length }; }
  recordAudit(event: Omit<AuditEvent, "id" | "timestamp">) { this.events.push({ ...event, id: id("AUDIT"), timestamp: now() }); }
}

export class FabricLedgerService implements LedgerService {
  readonly mode = "fabric" as const;
  async health() { return { status: "unavailable" as const, mode: this.mode, detail: "Fabric adapter is planned for Phase 5 and is not connected" }; }
  private unavailable(): never { throw unavailable("Fabric mode is selected, but the Fabric adapter is not connected yet"); }
  listLands(): Promise<LandAsset[]> { return Promise.reject(this.unavailable()); }
  getLand(): Promise<LandAsset | undefined> { return Promise.reject(this.unavailable()); }
  getHistory(): Promise<TransactionRecord[]> { return Promise.reject(this.unavailable()); }
  getProof(): Promise<{ propertyId: string; networkMode: "simulated-fabric" | "fabric"; blockHash: string; txCount: number; latestTransaction: TransactionRecord | null; endorsements: string[]; detail: string }> { return Promise.reject(this.unavailable()); }
  getMine(): Promise<LandAsset[]> { return Promise.reject(this.unavailable()); }
  register(): Promise<LandAsset> { return Promise.reject(this.unavailable()); }
  listForSale(): Promise<LandAsset> { return Promise.reject(this.unavailable()); }
  cancelListing(): Promise<LandAsset> { return Promise.reject(this.unavailable()); }
  purchase(): Promise<{ land: LandAsset; transaction: TransactionRecord; feeKobo: number; sellerProceedsKobo: number }> { return Promise.reject(this.unavailable()); }
  updateLevy(): Promise<LandAsset> { return Promise.reject(this.unavailable()); }
  attachDocument(): Promise<LandAsset> { return Promise.reject(this.unavailable()); }
  transactions(): Promise<TransactionRecord[]> { return Promise.reject(this.unavailable()); }
  audit(): Promise<AuditEvent[]> { return Promise.reject(this.unavailable()); }
  revenueSummary(): Promise<{ totalRevenueKobo: number; transferCount: number }> { return Promise.reject(this.unavailable()); }
}
