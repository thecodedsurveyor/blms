import express, { type Request, type Response } from "express";
import { getSyntheticIdentity, maskNin, syntheticIdentityRecords, verifySyntheticIdentity } from "@blms/shared";

const app = express();
app.use(express.json({ limit: "32kb" }));
const ok = (res: Response, data: unknown) => res.json({ data, error: null });
const fail = (res: Response, status: number, code: string, message: string) => res.status(status).json({ data: null, error: { code, message } });

app.post("/verify", (req, res) => { const nin = String(req.body?.nin || ""); const fullName = String(req.body?.fullName || ""); const result = verifySyntheticIdentity(nin, fullName, req.body?.organisation, req.body?.dateOfBirth); if (!result.verified) { console.info(`Synthetic identity verification failed for NIN ${maskNin(nin)}`); return fail(res, 422, "IDENTITY_NOT_VERIFIED", result.reason); } console.info(`Synthetic identity verification succeeded for NIN ${maskNin(nin)}`); return ok(res, { ...result.record, nin: maskNin(result.record.nin), synthetic: true }); });
app.get("/records/:nin/status", (req, res) => { if (req.header("x-local-test-key") !== (process.env.IDENTITY_TEST_KEY || "local-demo-key")) return fail(res, 403, "FORBIDDEN", "Authorised local testing header required"); const record = getSyntheticIdentity(String(req.params.nin)); if (!record) return fail(res, 404, "NOT_FOUND", "Synthetic identity not found"); return ok(res, { nin: maskNin(record.nin), status: record.status, permittedOrganisation: record.permittedOrganisation, synthetic: true }); });
app.get("/health", (_req, res) => ok(res, { status: "ok", records: syntheticIdentityRecords.length, synthetic: true, detail: "No live NIMC connection" }));

const port = Number(process.env.IDENTITY_PORT || 4100);
if (process.env.IDENTITY_START === "true") app.listen(port, () => console.log(`BLMS synthetic identity gateway listening on http://localhost:${port}`));
export { app };
