# BLMS offline demo walkthrough

This walkthrough requires only Node.js and a browser. It does not require Docker, Go, Fabric, IPFS, a database, or environment variables.

## Start

```bash
npm install
npm run dev:offline
```

Open `http://localhost:5173/`.

## Citizen flow

1. Sign in as `citizen.seller` / `Citizen123!`.
2. Register a parcel from **Register parcel**.
3. Open the parcel record and store a valid PDF, PNG, or JPEG.
4. Verify the original file and confirm `MATCH`.
5. Verify a changed file and confirm `MISMATCH`.
6. List the parcel for sale, or inspect `PROP-001` in the marketplace.
7. Sign out and sign in as `citizen.buyer` / `Citizen123!`.
8. Purchase the listed parcel and inspect the ownership/history change.

## Government flow

1. Sign in as `government.officer` / `Government123!`.
2. Open `/levies` (**Levy management**) and update a parcel levy.
3. Review `/revenue` (**Revenue summary**) and `/audit` (**Audit trail**).
4. Open `/documents` (**Document verification**) to compare a candidate file against a stored CID.

## Administrator flow

1. Sign in as `admin` / `Admin123!`.
2. Open `/system-health` (**System health**) to see browser-local service status.
3. Use **Reset local demo** to clear local state and return to login.

All values are synthetic academic data. Transfers and revenue are simulated; no funds move.
