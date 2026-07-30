# Free-hosting deployment path

This project can be hosted for a school demonstration without paid always-on infrastructure.

## Recommended split

- Frontend: Netlify or Cloudflare Pages static hosting.
- Backend: Render free web service.
- Ledger: `LEDGER_MODE=mock`, which exposes the same API contract and a deterministic simulated Fabric proof endpoint.
- Documents: `IPFS_MODE=local`, which stores files in a local content-addressed vault and returns CID-like hashes.

## Why not real Fabric/Kubo on free hosting?

Hyperledger Fabric requires multiple long-running containers for peers, orderers, certificate authorities, chaincode, and usually CouchDB. Kubo can run in Docker locally, but a useful pinned IPFS node also needs memory, disk, and persistent runtime. Free web hosts are designed for small sleeping web services, not persistent multi-container blockchain networks.

For the school project, the hosted demo should therefore show the complete workflow through the API while clearly labelling the ledger and document services as simulated/local demo services.

## Backend on Render free

Use `render.yaml` or create a Render Web Service manually.

- Build command: `npm ci && npm run build:api`
- Start command: `npm run start:api`
- Environment:
  - `NODE_ENV=production`
  - `LEDGER_MODE=mock`
  - `IPFS_MODE=local`
  - `WEB_ORIGIN=https://your-frontend-site.netlify.app`
  - `JWT_SECRET=<generate a long random value>`

The free service can sleep after inactivity and can reset demo state on restart. That is acceptable for a school demo, but not production.

## Frontend

For the browser-only version, leave `VITE_API_URL` empty.

For the hosted backend version, set:

```text
VITE_API_URL=https://your-render-api.onrender.com/api/v1
```

Then rebuild/redeploy the frontend.

## Demo endpoints

- API health: `/api/v1/health`
- Fabric health: `/api/v1/health/fabric`
- IPFS/document health: `/api/v1/health/ipfs`
- Simulated ledger proof: `/api/v1/lands/:propertyId/proof`
