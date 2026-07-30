# BLMS land chaincode

This is the Fabric-mode business contract for the BLMS research prototype. It is deliberately separate from the browser-local adapter so the offline demo remains deployable to Netlify.

## Contract rules

- State-changing calls require a synthetic Fabric certificate with active `ninRef`, `ninStatus=ACTIVE`, and `fullName` attributes.
- Owner checks use the submitting certificate identity, never an arbitrary owner supplied by the API.
- `InitiatePurchase` is atomic, calculates a 5% simulated government fee in integer kobo, clears the listing, changes ownership, and emits `LandTransferred`.
- Government levy updates require `GovernmentOrgMSP`.
- Only CIDs and safe document metadata are stored on the ledger; document bytes remain off-chain.
- The network deployment must apply `AND('CitizenOrgMSP.peer','GovernmentOrgMSP.peer')` for state-changing transactions.

## Local verification

Install Go 1.22+ and run:

```bash
go mod tidy
go test ./...
go vet ./...
```

The current workspace does not have Go installed, so these commands are documented but not claimed as executed yet.
