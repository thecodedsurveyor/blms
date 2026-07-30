import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { unavailable } from "./errors.js";

export type DocumentUpload = { bytes: Buffer; originalName: string; mimeType: string };
export type DocumentHealth = { status: "ok" | "unavailable"; mode: "local-fallback" | "http"; detail: string };

const MAX_BYTES = 5 * 1024 * 1024;
const safeName = (value: string) => value.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-120);
const contentType = (bytes: Buffer) => bytes.subarray(0, 5).toString("ascii") === "%PDF-" ? "application/pdf" : bytes.subarray(0, 8).toString("hex") === "89504e470d0a1a0a" ? "image/png" : bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff ? "image/jpeg" : null;
const extFor = (name: string) => path.extname(name).toLowerCase();
const cidFor = (bytes: Buffer) => `bafybeia${crypto.createHash("sha256").update(bytes).digest("hex")}`;

export interface DocumentVault { health(): Promise<DocumentHealth>; add(upload: DocumentUpload): Promise<{ cid: string; mimeType: string; filename: string }>; get(cid: string): Promise<{ bytes: Buffer; mimeType: string }>; }

export class LocalContentAddressedVault implements DocumentVault {
  private readonly root = path.resolve(process.cwd(), "storage/runtime/ipfs");
  async health(): Promise<DocumentHealth> { await fs.mkdir(this.root, { recursive: true }); return { status: "ok", mode: "local-fallback", detail: "Local content-addressed document vault active; Kubo is optional for this demo" }; }
  async add(upload: DocumentUpload) { if (upload.bytes.length === 0 || upload.bytes.length > MAX_BYTES) throw new Error("Document must be between 1 byte and 5 MB"); const detected = contentType(upload.bytes); const ext = extFor(upload.originalName); const allowed = new Map([[".pdf", "application/pdf"], [".png", "image/png"], [".jpg", "image/jpeg"], [".jpeg", "image/jpeg"]]); if (!detected || allowed.get(ext) !== detected || (upload.mimeType !== detected && upload.mimeType !== "application/octet-stream")) throw new Error("Only valid PDF, PNG, and JPEG files are accepted"); const cid = cidFor(upload.bytes); await fs.mkdir(this.root, { recursive: true }); await fs.writeFile(path.join(this.root, cid), upload.bytes, { flag: "wx" }).catch((error: NodeJS.ErrnoException) => { if (error.code !== "EEXIST") throw error; }); await fs.writeFile(path.join(this.root, `${cid}.json`), JSON.stringify({ filename: safeName(upload.originalName), mimeType: detected }), { flag: "wx" }).catch((error: NodeJS.ErrnoException) => { if (error.code !== "EEXIST") throw error; }); return { cid, mimeType: detected, filename: safeName(upload.originalName) }; }
  async get(cid: string) { if (!/^bafybeia[a-f0-9]{64}$/.test(cid)) throw new Error("Invalid document CID"); try { const [bytes, meta] = await Promise.all([fs.readFile(path.join(this.root, cid)), fs.readFile(path.join(this.root, `${cid}.json`), "utf8")]); return { bytes, mimeType: JSON.parse(meta).mimeType as string }; } catch { throw new Error("Document not found"); } }
}

export class IpfsHttpVault implements DocumentVault {
  private readonly baseUrl = process.env.IPFS_API_URL || "http://127.0.0.1:5001";
  async health(): Promise<DocumentHealth> { try { const response = await fetch(`${this.baseUrl}/api/v0/version`); if (!response.ok) throw new Error(); return { status: "ok", mode: "http", detail: "Local Kubo IPFS API reachable" }; } catch { return { status: "unavailable", mode: "http", detail: "Local Kubo IPFS API is unavailable" }; } }
  async add(upload: DocumentUpload) { const form = new FormData(); form.append("file", new Blob([new Uint8Array(upload.bytes) as unknown as BlobPart], { type: upload.mimeType }), safeName(upload.originalName)); const response = await fetch(`${this.baseUrl}/api/v0/add?pin=true`, { method: "POST", body: form }); if (!response.ok) throw unavailable("Local IPFS upload failed"); const result = await response.json() as { Hash: string; Name: string }; return { cid: result.Hash, mimeType: upload.mimeType, filename: safeName(result.Name) }; }
  async get(cid: string) { if (!/^[a-zA-Z0-9]{20,}$/.test(cid)) throw new Error("Invalid document CID"); const response = await fetch(`${this.baseUrl}/api/v0/cat?arg=${encodeURIComponent(cid)}`); if (!response.ok) throw unavailable("Local IPFS document retrieval failed"); const bytes = Buffer.from(await response.arrayBuffer()); return { bytes, mimeType: "application/octet-stream" }; }
}

export const documentVault: DocumentVault = process.env.IPFS_MODE === "http" ? new IpfsHttpVault() : new LocalContentAddressedVault();
