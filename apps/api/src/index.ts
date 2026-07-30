import { app } from "./app.js";

const port = Number(process.env.PORT || process.env.API_PORT || 4000);
app.listen(port, () => console.log(`BLMS API listening on http://localhost:${port}/api/v1 (${process.env.LEDGER_MODE || "mock"} mode)`));
