from __future__ import annotations

from pathlib import Path

from create_lecturer_deliverables import (
    OUT,
    add_callout,
    add_references,
    add_table,
    base_document,
    bullet,
    paragraph,
    title_page,
)


def build_report() -> Path:
    doc = base_document("Supervisor Implementation Progress Report")
    title_page(
        doc,
        "Implementation Progress Report",
        "A defensible status report for the Blockchain-Based Land Management System (BLMS)",
        "Project Supervisor Submission",
    )

    doc.add_heading("Executive summary", level=1)
    paragraph(
        doc,
        "BLMS is currently a working local academic prototype for secure and transparent land-administration workflows. The completed delivery is the Docker-free, browser-local and static-deployment path: a responsive React dashboard supports synthetic user authentication, parcel registration, property listing, simulated purchase, document-content verification, government levy management, audit history, and revenue summary. The project also includes an optional Express API, a mock ledger, a synthetic identity gateway, and a Go Hyperledger Fabric chaincode package."
    )
    paragraph(
        doc,
        "The present evidence supports a claim of a functioning research prototype, not a production land registry. The system is not connected to NIMC, a government registry, a bank, a payment rail, a live IPFS node, or a running Hyperledger Fabric network. The chaincode source is present, but Fabric-network deployment, Gateway integration, Go compilation/testing, Caliper benchmarking, and user/expert evaluation are still pending. This distinction is deliberate and is central to a defensible presentation."
    )
    add_callout(
        doc,
        "Current position.",
        "The local and static demonstration path is implemented and tested. The Hyperledger Fabric research track has started with Go chaincode but has not yet become the active application ledger."
    )

    doc.add_heading("1. Project purpose and scope", level=1)
    paragraph(
        doc,
        "The project investigates how a blockchain-based land management system could improve traceability, accountability, and document-integrity checking in land administration in Nigeria. The prototype models the core workflow: register a parcel, attach and verify a supporting document, list a property, perform a simulated transfer, apply a levy through a government role, and retain a history of actions."
    )
    paragraph(
        doc,
        "The scope has been delivered in phases so that the application can be demonstrated locally and hosted as a static site without requiring Docker, paid infrastructure, or external government services. This was a practical implementation decision: it permits repeatable academic demonstration while leaving the more complex permissioned-blockchain deployment as a separately testable research phase."
    )

    doc.add_heading("2. Implementation progress", level=1)
    add_table(
        doc,
        ["Workstream", "Current status", "Evidence and scope boundary"],
        [
            ["Web application", "Implemented", "React/Vite dashboard with responsive navigation, role-aware pages, registration, marketplace, audit, profile, health, and reset flows."],
            ["Browser-local demo", "Implemented", "Default adapter uses browser localStorage and local content hashing; no API, Docker, IPFS node, Fabric network, or environment variable is required."],
            ["Optional API and mock ledger", "Implemented", "Express API with validation, role checks, JWT/cookie security controls, audit events, and a deterministic in-memory ledger contract."],
            ["Identity and document workflow", "Implemented for local demonstration", "Synthetic NIN records and masked logging; SHA-256-based document content identifiers with MATCH/MISMATCH verification. No live NIMC integration."],
            ["Static deployment", "Implemented", "Netlify configuration produces a static React build that automatically uses the browser-local adapter when no API URL is provided."],
            ["Go land chaincode", "Source implemented; not execution-verified", "Contract source exists for Fabric-mode rules. Go is not installed in the workspace, so Go test/vet and network deployment have not been executed."],
            ["Fabric network and Gateway adapter", "Pending", "No two-organisation network, certificates, peers/orderers, channel, deployed chaincode, or FabricLedgerService is currently running."],
            ["Performance and user evaluation", "Pending", "No Caliper benchmark, throughput claim, formal E2E suite, or expert/user study has been executed."],
        ],
        [1900, 1900, 5560],
    )

    doc.add_heading("3. What the working prototype demonstrates", level=1)
    doc.add_heading("3.1 Role-aware land workflow", level=2)
    paragraph(
        doc,
        "Four development-only synthetic accounts demonstrate citizen, government-officer, and administrator roles. A citizen can create a parcel record, while duplicate parcel and title numbers are rejected. The current owner can list and cancel a listing; another citizen can complete a simulated purchase. The system records the associated transaction and audit entry. No money is moved and no legal title is conveyed."
    )
    doc.add_heading("3.2 Document-content verification", level=2)
    paragraph(
        doc,
        "The prototype accepts PDF, PNG, and JPEG documents within a defined size limit and validates the file signature. It calculates a browser-local SHA-256-based content identifier. A later candidate file is marked MATCH only when its content produces the same identifier; altered content returns MISMATCH. This demonstrates integrity checking, not a production IPFS vault or legal evidence repository."
    )
    doc.add_heading("3.3 Government and audit functions", level=2)
    paragraph(
        doc,
        "Government and administrator roles can apply land levies and view a simulated revenue summary. Audit entries record the actor, organisation, action, time, property reference, and outcome. In the static mode these records live in the browser, so they are a workflow demonstration rather than independently replicated blockchain evidence."
    )
    doc.add_heading("3.4 Responsive static delivery", level=2)
    paragraph(
        doc,
        "The dashboard is responsive. On compact screens, the sidebar becomes a slide-in menu with an overlay, close action, and Escape-key support. The static build can be published to Netlify with no environment variables because it defaults to the browser-local adapter. This makes it suitable for assessment, demonstrations, and interface testing without external dependencies."
    )

    doc.add_heading("4. Technical architecture and technology rationale", level=1)
    add_table(
        doc,
        ["Layer", "Technology", "Reason for use"],
        [
            ["Frontend", "React, TypeScript, Vite, React Router, React Query", "Supports a maintainable responsive single-page application, typed data flow, role-aware screens, and a fast static build."],
            ["Offline data layer", "Browser localStorage and Web Crypto", "Allows all core demonstration flows to run locally or on static hosting; Web Crypto provides deterministic content hashing for document verification."],
            ["Optional backend", "Node.js, Express, Zod, JWT, bcrypt", "Provides a conventional API-mode architecture with input validation, authentication, protected routes, and an adapter boundary for future ledger replacement."],
            ["Identity gateway", "Express synthetic service", "Makes identity-dependent workflow behaviour testable without claiming access to NIMC or real NIN records."],
            ["Ledger abstraction", "LedgerService contract and mock ledger", "Separates application workflows from the underlying ledger and permits future replacement by a Fabric adapter."],
            ["Blockchain research track", "Hyperledger Fabric-oriented Go chaincode", "Models permissioned membership, role/organisation checks, duplicate prevention, history, and events for a two-organisation citizen-government design."],
            ["Deployment", "Netlify static hosting", "Hosts the frontend at no infrastructure cost for prototype review; it is not the host for a full Fabric network."],
        ],
        [1700, 2380, 5280],
    )

    doc.add_heading("5. Verification results", level=1)
    paragraph(
        doc,
        "The following verification commands were executed in the project workspace on 28 July 2026. The test evidence is limited to completed checks; unexecuted Fabric and Go tasks are listed as pending rather than inferred from source code.")
    add_table(
        doc,
        ["Verification activity", "Result", "What it establishes"],
        [
            ["TypeScript typecheck", "Passed", "Shared package, API, identity gateway, and web workspace compile without reported TypeScript errors."],
            ["API automated tests", "5 passed; 0 failed", "Validated mock-mode health, login/land query, simulated purchase and fee allocation, government-only revenue access, and document MATCH/MISMATCH behaviour."],
            ["Identity-gateway tests", "3 passed; 0 failed", "Validated synthetic-record health, masked synthetic verification, and local status-key protection."],
            ["Production web build", "Passed", "Vite transformed 92 modules and produced the static frontend bundle for deployment."],
            ["Go chaincode verification", "Not executed", "Go is not installed in this workspace; `go test ./...` and `go vet ./...` remain required before chaincode claims can be made."],
            ["Fabric integration / benchmark", "Not executed", "No running Fabric topology, Gateway adapter, Caliper workload, throughput result, or comparative benchmark exists yet."],
        ],
        [2540, 2160, 4660],
    )

    doc.add_heading("6. Hyperledger Fabric contribution and current boundary", level=1)
    paragraph(
        doc,
        "Hyperledger Fabric remains the intended blockchain platform for the full research implementation. The repository includes Go chaincode for land lifecycle operations. Its stated rules include certificate-attribute checks, duplicate parcel/title prevention, owner-only listing, government-only levy updates, atomic purchase logic, a simulated 5% government fee, document CID comparison, history queries, and a `LandTransferred` event. It is designed for an endorsement policy involving CitizenOrg and GovernmentOrg."
    )
    paragraph(
        doc,
        "This contribution should be described accurately to a supervisor: it is a concrete chaincode artifact, not proof of a live distributed ledger. A production-like Fabric result requires Go toolchain verification, certificate authorities, peers, orderers, channel creation, endorsement-policy configuration, chaincode deployment, and a Node Gateway adapter that makes the application submit and query real ledger transactions."
    )
    add_callout(
        doc,
        "Recommended defence wording.",
        "“The project has implemented and verified the complete local user workflow. The Fabric chaincode has been designed as the ledger-rule layer, while the Fabric network and Gateway integration are the next controlled deployment phase. I do not claim live Fabric performance until that phase is executed and measured.”"
    )

    doc.add_heading("7. Limitations", level=1)
    for item in [
        "All accounts, identity records, parcels, payments, revenue values, and transactions are synthetic demonstration data.",
        "The static browser mode is not a blockchain, a government registry, or an independently replicated audit ledger; its data is stored in the local browser.",
        "The document-CID workflow demonstrates file-content integrity only. It does not make a document legally valid or provide a live IPFS network.",
        "No external payment, bank, NIMC, or government-land-registry service is connected.",
        "No performance, TPS, latency, user-acceptance, expert-evaluation, or security-compliance claim should be made until a documented evaluation is completed.",
        "The Go chaincode source has not been compiled, vetted, or deployed in this workspace because Go and a Fabric network are not available.",
    ]:
        bullet(doc, item)

    doc.add_heading("8. Next implementation and evaluation plan", level=1)
    paragraph(doc, "The next phase should focus on evidence, not additional unverified claims. The sequence below preserves the existing local workflow while progressively replacing the mock/browser ledger behind the existing adapter contract.")
    for item in [
        "Install Go 1.22+ and run `go mod tidy`, `go test ./...`, and `go vet ./...` for the land chaincode; fix any findings before deployment.",
        "Build the two-organisation Hyperledger Fabric network with separate CitizenOrg and GovernmentOrg identities, channel configuration, TLS, peer/orderer services, and the intended endorsement policy.",
        "Deploy the Go chaincode and implement the `FabricLedgerService`/Gateway adapter so the application can submit and query Fabric transactions without changing the UI workflow.",
        "Create repeatable integration tests for registration, duplicate rejection, listing, purchase, levy updates, history, document CID verification, and role failures in Fabric mode.",
        "Define a Caliper or equivalent performance protocol with stated hardware, topology, workload, payload sizes, repetitions, and baseline before collecting throughput or latency results.",
        "Seek supervisor/ethics guidance before conducting any expert or user study; record sample, instrument, method, and limitations before reporting acceptance or usability results.",
    ]:
        bullet(doc, item)

    doc.add_heading("9. Conclusion", level=1)
    paragraph(
        doc,
        "BLMS has reached a credible local-prototype milestone. It can demonstrate secure workflow concepts through typed validation, role checks, parcel/title uniqueness, audit records, document-content verification, simulated transfer logic, and a static responsive interface. The test suite and production build provide objective evidence that this local slice works. The project has also begun the central blockchain requirement through a Go land-chaincode artifact. The appropriate next claim is not that a full blockchain land registry is already deployed; it is that the local system is implemented and verified, and the Fabric network/integration phase is clearly specified and ready for controlled execution."
    )

    add_references(
        doc,
        [
            "BLMS project README, implementation plan, source code, test output, and build output; verified in the local project workspace on 28 July 2026.",
            "Androulaki, E., Barger, A., Bortnikov, V., et al. (2018). Hyperledger Fabric: A distributed operating system for permissioned blockchains. Proceedings of the Thirteenth EuroSys Conference. https://doi.org/10.1145/3190508.3190538",
            "Zein, R. M., & Twinomurinzi, H. (2024). Information sharing in land registration using Hyperledger Fabric blockchain. Digital, 2(2), 6. https://doi.org/10.3390/digital2020006",
        ],
    )

    path = OUT / "BLMS_Supervisor_Implementation_Progress_Report.docx"
    doc.save(path)
    return path


if __name__ == "__main__":
    print(build_report())
