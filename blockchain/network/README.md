# Hyperledger Fabric network — Phase 4

The network track is optional to the browser-local demo. Its target topology is:

- `CitizenOrgMSP` and `GovernmentOrgMSP` on `landchannel`;
- one CA, one primary peer, one secondary peer, and CouchDB per organisation;
- three Raft orderers with TLS enabled;
- state-changing land transactions endorsed by `AND('CitizenOrgMSP.peer','GovernmentOrgMSP.peer')`.

The Go chaincode is now present in `blockchain/chaincode/land`. Network compose/configuration and the Node Fabric Gateway adapter remain the next integration steps. They must only be selected explicitly with Fabric mode; the default browser and Netlify builds do not depend on this network.

Fabric’s Gateway architecture delegates endorsement and transaction submission to a peer Gateway, while chaincode uses transaction context and client identity to enforce ledger rules. See the official [Fabric Gateway documentation](https://hyperledger-fabric.readthedocs.io/en/latest/gateway.html) and [transaction context documentation](https://hyperledger-fabric.readthedocs.io/en/release-2.3/developapps/transactioncontext.html).
