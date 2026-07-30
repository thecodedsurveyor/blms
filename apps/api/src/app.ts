import crypto from "node:crypto";
import express, { type NextFunction, type Request, type Response } from "express";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import multer from "multer";
import { RegisterLandInputSchema, verifySyntheticIdentity } from "@blms/shared";
import type { LocalUser, Role } from "@blms/shared";
import { authenticate, issueToken, publicUser, readToken, users } from "./auth.js";
import { FabricLedgerService, MockLedgerService, type LedgerService } from "./ledger.js";
import { AppError } from "./errors.js";
import { documentVault } from "./documents.js";

declare global { namespace Express { interface Request { requestId: string; user?: LocalUser; } } }
const ledger: LedgerService = process.env.LEDGER_MODE === "fabric" ? new FabricLedgerService() : new MockLedgerService();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
const app = express();
const normalizeOrigin = (origin: string) => origin.trim().replace(/\/$/, "");
const allowedOrigins = Array.from(new Set([
  "http://localhost:5173",
  "https://blms-local-registry.netlify.app",
  ...(process.env.WEB_ORIGIN || "").split(",")
].map(normalizeOrigin).filter(Boolean)));
app.use((req, res, next) => { req.requestId = crypto.randomUUID(); res.setHeader("X-Request-Id", req.requestId); next(); });
app.use((req, res, next) => {
  const origin = typeof req.headers.origin === "string" ? normalizeOrigin(req.headers.origin) : "";
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  return next();
});
app.use(helmet()); app.use(express.json({ limit: "1mb" })); app.use(cookieParser());
app.use(rateLimit({ windowMs: 60_000, limit: 60, standardHeaders: true, legacyHeaders: false }));
app.use((req, res, next) => { const token = req.cookies?.blms_access; if (token) { try { const claims = readToken(token); const user = users.find((item) => item.id === claims.sub); if (user) req.user = publicUser(user); } catch { /* expired cookie is treated as anonymous */ } } next(); });

const ok = (res: Response, data: unknown, status = 200) => res.status(status).json({ data, error: null });
const fail = (res: Response, error: AppError) => res.status(error.statusCode).json({ data: null, error: { code: error.code, message: error.message } });
const requireAuth = (req: Request, _res: Response, next: NextFunction) => { if (!req.user) return next(new AppError(401, "UNAUTHENTICATED", "Authentication required")); next(); };
const requireRole = (...roles: Role[]) => (req: Request, _res: Response, next: NextFunction) => { if (!req.user || !roles.includes(req.user.role)) return next(new AppError(403, "FORBIDDEN", "You do not have permission for this action")); next(); };
const requireVerifiedIdentity = (req: Request, _res: Response, next: NextFunction) => { const user = req.user; if (!user || !verifySyntheticIdentity(user.nin, user.fullName, user.organisation).verified) return next(new AppError(403, "IDENTITY_NOT_VERIFIED", "The signed-in synthetic identity is not active or does not match this account")); next(); };
const record = (action: string, req: Request, status: "SUCCESS" | "FAILED", detail: string, propertyId?: string) => { if (ledger instanceof MockLedgerService && req.user) ledger.recordAudit({ action, actor: req.user.username, organisation: req.user.organisation, propertyId, status, detail }); };
const asyncRoute = (handler: (req: Request, res: Response) => Promise<unknown>) => (req: Request, res: Response, next: NextFunction) => handler(req, res).catch(next);

const router = express.Router();
router.post("/auth/login", (req, res, next) => { try { const user = authenticate(String(req.body?.username || ""), String(req.body?.password || "")); req.user = publicUser(user); res.cookie("blms_access", issueToken(publicUser(user)), { httpOnly: true, sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", secure: process.env.NODE_ENV === "production", maxAge: 2 * 60 * 60 * 1000 }); record("LOGIN", req, "SUCCESS", "Local session created"); return ok(res, publicUser(user)); } catch (error) { return next(error); } });
router.post("/auth/logout", (req, res) => { res.clearCookie("blms_access"); record("LOGOUT", req, "SUCCESS", "Local session cleared"); return ok(res, { loggedOut: true }); });
router.get("/auth/me", requireAuth, (req, res) => ok(res, req.user));
router.get("/health", asyncRoute(async (_req, res) => ok(res, { status: "ok", mode: ledger.mode, services: { api: "ok", ledger: (await ledger.health()).status, identity: "ok", ipfs: (await documentVault.health()).status } })));
router.get("/health/fabric", asyncRoute(async (_req, res) => { const result = await ledger.health(); return result.status === "ok" && ledger.mode === "fabric" ? ok(res, result) : res.status(503).json({ data: result, error: { code: "SERVICE_UNAVAILABLE", message: result.detail } }); }));
router.get("/health/ipfs", asyncRoute(async (_req, res) => { const result = await documentVault.health(); return result.status === "ok" ? ok(res, result) : res.status(503).json({ data: result, error: { code: "SERVICE_UNAVAILABLE", message: result.detail } }); }));
router.get("/health/identity", (_req, res) => ok(res, { status: "ok", mode: "in-process-synthetic", records: 200, detail: "Synthetic identity verifier active; no live NIMC connection" }));

router.get("/lands", requireAuth, asyncRoute(async (req, res) => ok(res, await ledger.listLands(String(req.query.search || "")))));
router.get("/lands/mine", requireAuth, asyncRoute(async (req, res) => ok(res, await ledger.getMine(req.user!))));
router.get("/lands/:propertyId/history", requireAuth, asyncRoute(async (req, res) => ok(res, await ledger.getHistory(String(req.params.propertyId)))));
router.get("/lands/:propertyId/proof", requireAuth, asyncRoute(async (req, res) => ok(res, await ledger.getProof(String(req.params.propertyId)))));
router.get("/lands/:propertyId", requireAuth, asyncRoute(async (req, res) => { const land = await ledger.getLand(String(req.params.propertyId)); if (!land) throw new AppError(404, "NOT_FOUND", "Property not found"); return ok(res, land); }));
router.post("/lands", requireAuth, requireVerifiedIdentity, asyncRoute(async (req, res) => { const input = RegisterLandInputSchema.parse({ ...req.body, latitude: Number(req.body.latitude), longitude: Number(req.body.longitude), sizeSqM: Number(req.body.sizeSqM), assessedValueKobo: Number(req.body.assessedValueKobo) }); const land = await ledger.register(input, req.user!); record("REGISTER_LAND", req, "SUCCESS", "Land registered", land.propertyId); return ok(res, land, 201); }));
router.post("/lands/:propertyId/list", requireAuth, requireVerifiedIdentity, asyncRoute(async (req, res) => { const propertyId = String(req.params.propertyId); const land = await ledger.listForSale(propertyId, Number(req.body.askingPriceKobo), req.user!); record("LIST_PROPERTY", req, "SUCCESS", "Property listed", land.propertyId); return ok(res, land); }));
router.delete("/lands/:propertyId/list", requireAuth, requireVerifiedIdentity, asyncRoute(async (req, res) => { const propertyId = String(req.params.propertyId); const land = await ledger.cancelListing(propertyId, req.user!); record("CANCEL_LISTING", req, "SUCCESS", "Listing cancelled", land.propertyId); return ok(res, land); }));
router.post("/lands/:propertyId/purchase", requireAuth, requireVerifiedIdentity, requireRole("CITIZEN"), asyncRoute(async (req, res) => { const propertyId = String(req.params.propertyId); const result = await ledger.purchase(propertyId, req.user!); record("PURCHASE", req, "SUCCESS", "SIMULATED — NO FUNDS MOVED", propertyId); return ok(res, result); }));
router.post("/lands/:propertyId/levies", requireAuth, requireVerifiedIdentity, requireRole("GOVERNMENT_OFFICER", "ADMIN"), asyncRoute(async (req, res) => { const propertyId = String(req.params.propertyId); const land = await ledger.updateLevy(propertyId, Number(req.body.levyKobo), req.user!); record("UPDATE_LEVY", req, "SUCCESS", "Levy updated", land.propertyId); return ok(res, land); }));
router.get("/transactions", requireAuth, asyncRoute(async (_req, res) => ok(res, await ledger.transactions())));
router.get("/revenue/summary", requireAuth, requireRole("GOVERNMENT_OFFICER", "ADMIN"), asyncRoute(async (_req, res) => ok(res, await ledger.revenueSummary())));
router.get("/audit", requireAuth, asyncRoute(async (_req, res) => ok(res, await ledger.audit())));
router.post("/lands/:propertyId/document", requireAuth, requireVerifiedIdentity, upload.single("document"), asyncRoute(async (req, res) => { if (!req.file) throw new AppError(400, "DOCUMENT_REQUIRED", "Attach a PDF, PNG, or JPEG document"); const result = await documentVault.add({ bytes: req.file.buffer, originalName: req.file.originalname, mimeType: req.file.mimetype }); const land = await ledger.attachDocument(String(req.params.propertyId), result.cid, result.filename, req.user!); record("DOCUMENT_UPLOAD", req, "SUCCESS", `Document stored as ${result.cid}`, land.propertyId); return ok(res, { land, cid: result.cid, filename: result.filename, mimeType: result.mimeType }, 201); }));
router.post("/lands/:propertyId/verify-document", requireAuth, upload.single("document"), asyncRoute(async (req, res) => { if (!req.file) throw new AppError(400, "DOCUMENT_REQUIRED", "Attach a candidate document"); const land = await ledger.getLand(String(req.params.propertyId)); if (!land) throw new AppError(404, "NOT_FOUND", "Property not found"); const result = await documentVault.add({ bytes: req.file.buffer, originalName: req.file.originalname, mimeType: req.file.mimetype }); const status = land.documentCid && land.documentCid === result.cid ? "MATCH" : "MISMATCH"; record("DOCUMENT_VERIFY", req, "SUCCESS", `${status} document verification`, land.propertyId); return ok(res, { status, candidateCid: result.cid, expectedCid: land.documentCid, detail: status === "MATCH" ? "Candidate content matches the on-record CID" : "Candidate content does not match the on-record CID" }); }));
router.get("/documents/:cid", requireAuth, asyncRoute(async (req, res) => { const result = await documentVault.get(String(req.params.cid)); res.setHeader("Content-Type", result.mimeType); res.setHeader("Content-Disposition", "inline"); return res.send(result.bytes); }));

app.use("/api/v1", router);
app.use((_req, res) => fail(res, new AppError(404, "NOT_FOUND", "Route not found")));
app.use((error: unknown, req: Request, res: Response, _next: NextFunction) => { const normalized = error instanceof AppError ? error : error instanceof Error && error.name === "ZodError" ? new AppError(400, "VALIDATION_ERROR", "Request validation failed") : error instanceof Error ? new AppError(400, "REQUEST_FAILED", error.message) : new AppError(500, "INTERNAL_ERROR", "Unexpected server error"); if (req.user) record("REQUEST_ERROR", req, "FAILED", normalized.message); return fail(res, normalized); });

export { app, ledger };
