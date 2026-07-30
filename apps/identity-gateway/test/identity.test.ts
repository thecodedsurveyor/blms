import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { app } from "../src/index.js";

test("health reports 200 synthetic records", async () => { const response = await request(app).get("/health"); assert.equal(response.status, 200); assert.equal(response.body.data.records, 200); });
test("verification masks the NIN and marks the result synthetic", async () => { const response = await request(app).post("/verify").send({ nin: "10000000001", fullName: "Amina Yusuf", organisation: "CitizenOrg" }); assert.equal(response.status, 200); assert.equal(response.body.data.synthetic, true); assert.equal(response.body.data.nin, "10••••01"); });
test("status endpoint requires the local testing key", async () => { const denied = await request(app).get("/records/10000000001/status"); assert.equal(denied.status, 403); const allowed = await request(app).get("/records/10000000001/status").set("x-local-test-key", "local-demo-key"); assert.equal(allowed.status, 200); });
