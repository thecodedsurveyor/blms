from __future__ import annotations

from pathlib import Path

from create_lecturer_deliverables import (
    OUT,
    add_callout,
    add_table,
    base_document,
    bullet,
    paragraph,
    title_page,
)


def build_guide() -> Path:
    doc = base_document("BLMS Supervisor Defence Guide")
    title_page(
        doc,
        "Supervisor Defence Guide",
        "Simple speaking notes for explaining the BLMS project",
        "Personal Presentation Guide - Not for Formal Submission",
    )

    doc.add_heading("Start with this", level=1)
    add_callout(
        doc,
        "Your 30-second explanation.",
        "“My project is a Blockchain-Based Land Management System. It is designed to make land registration, document checking, ownership transfer, and audit records clearer and harder to manipulate. I have completed and tested the local working prototype. The full Hyperledger Fabric network is the next implementation phase; I have written the Go chaincode rules, but I am not claiming that the live Fabric network is already running.”",
    )

    doc.add_heading("1. The problem I am solving", level=1)
    paragraph(doc, "Keep this part simple. The problem is not just 'land records are on paper.' The real issues are slow verification, possible duplicate sale or allocation, unclear ownership history, document tampering, and too much dependence on manual processes.")
    bullet(doc, "A buyer should be able to check a property record and its history more easily.")
    bullet(doc, "A land officer should be able to see who performed an action and when it happened.")
    bullet(doc, "A changed document should be detectable instead of being silently accepted.")
    bullet(doc, "The system should reject obvious mistakes, such as registering the same parcel or title number twice.")

    doc.add_heading("2. What I have actually built", level=1)
    paragraph(doc, "Say this confidently: the local prototype is working. It can run on a laptop or static web hosting without Docker, a database server, Fabric, IPFS, or environment variables.")
    add_table(
        doc,
        ["Feature", "Simple explanation"],
        [
            ["Login and roles", "There are citizen, government-officer, and administrator roles. Each role sees only the actions it is allowed to perform."],
            ["Land registration", "A citizen can register a land parcel. The system rejects duplicate parcel or title numbers."],
            ["Marketplace and transfer", "An owner can list land for sale. Another citizen can complete a simulated purchase. It is a demonstration only; no money moves and it does not create legal title."],
            ["Document check", "The system creates a fingerprint of a document. Uploading the same document later gives MATCH; a changed document gives MISMATCH."],
            ["Government actions", "A government officer can apply a levy and view simulated revenue information."],
            ["Audit history", "The system records who did what, when, and on which property."],
            ["Responsive interface", "The application works on desktop and mobile. On small screens, the sidebar becomes a slide-in menu."],
        ],
        [2580, 6780],
    )

    doc.add_heading("3. How to explain the technologies", level=1)
    add_table(
        doc,
        ["Technology", "Explain it like this"],
        [
            ["React and Vite", "They build the website users see and make it fast to run locally or deploy as a static site."],
            ["TypeScript", "It helps prevent coding mistakes by checking the shape of data before the app runs."],
            ["localStorage", "It is the browser's small local storage. I used it so the demo works without a server. It is not the final blockchain ledger."],
            ["SHA-256 content hash", "It is like a digital fingerprint for a file. If the document changes, the fingerprint changes too."],
            ["Express API and mock ledger", "They are the optional server version of the system. The mock ledger lets me test the business rules before connecting a real blockchain."],
            ["Hyperledger Fabric", "It is the permissioned blockchain planned for the full version. It is suitable because government and citizen organisations can have controlled roles instead of everyone being anonymous."],
            ["Go chaincode", "These are the blockchain rules written in Go: who may register, list, buy, update levies, and how duplicate records are rejected."],
        ],
        [2580, 6780],
    )

    doc.add_heading("4. What is tested and what is still pending", level=1)
    paragraph(doc, "Do not say 'everything is finished.' Say exactly what is complete and what is next.")
    add_table(
        doc,
        ["Status", "What you should say"],
        [
            ["Completed and tested", "TypeScript checks pass. Five API tests pass. Three identity-gateway tests pass. The production web build also passes."],
            ["Completed for local demo", "The land, document, audit, role, and responsive interface workflows work locally and on static hosting."],
            ["Started but not complete", "The Go chaincode has been written for Hyperledger Fabric, but it has not been compiled or deployed because Go and the Fabric network are not installed in this workspace."],
            ["Not yet done", "Live Fabric network, Gateway integration, live IPFS, real NIMC verification, Caliper performance testing, and a formal user/expert study."],
        ],
        [2580, 6780],
    )
    add_callout(
        doc,
        "The honest answer if asked, 'Is blockchain running now?'",
        "“The local application is running now. The blockchain rule layer has been written as Go chaincode, but the full Fabric network is the next phase. I separated them so that the application can be tested and demonstrated locally before I introduce Docker, certificates, peers, and other blockchain infrastructure.”",
    )

    doc.add_heading("5. Five-minute demo flow", level=1)
    paragraph(doc, "Use this order in the demo. It tells a clear story instead of clicking around randomly.")
    for item in [
        "Log in as a citizen and show the dashboard. Point out that the data is clearly marked as a local static demo.",
        "Register a new land parcel. Explain that duplicate parcel and title numbers are rejected.",
        "Open the property, attach a PDF or image, and verify it. Explain the MATCH/MISMATCH document fingerprint result.",
        "List the property for sale. Log in as the second citizen and complete the simulated purchase.",
        "Open the transaction history and audit log. Explain that this is the accountability trail.",
        "Log in as a government officer, apply a levy, and show the revenue view.",
        "Finish by explaining that the local workflow is working now; the next step is to connect the same rules to a real Fabric network.",
    ]:
        bullet(doc, item)

    doc.add_heading("6. Likely supervisor questions and simple answers", level=1)
    add_table(
        doc,
        ["Question", "Simple answer"],
        [
            ["Why did you use blockchain?", "Because land records need traceability and controlled shared history. A permissioned blockchain can make it easier to see and verify approved changes between known organisations."],
            ["Why not use only a normal database?", "A normal database can work. The blockchain research part is useful when more than one trusted organisation needs a shared record and clear approval rules. I will compare the trade-offs during the Fabric evaluation phase."],
            ["Is this connected to the government registry?", "No. It uses synthetic data. A government connection needs formal permission, legal review, secure identity integration, and data-protection controls."],
            ["Is the transfer a real land transfer?", "No. It is a simulated workflow that demonstrates the business rules. Legal transfer still requires the proper government and legal process."],
            ["Is IPFS running?", "Not in the current static demo. I demonstrate the same document-integrity idea locally using a content hash. A live IPFS/Kubo node is a future integration step."],
            ["Is Hyperledger Fabric running?", "Not yet. The Go chaincode is written, but a real Fabric network, certificates, peers, Gateway adapter, and tests must be deployed before I claim that result."],
            ["How do you know the current system works?", "I ran the TypeScript check, five API tests, three identity tests, and a production web build. All passed on 28 July 2026."],
            ["What is the next major milestone?", "Compile and test the Go chaincode, deploy the two-organisation Fabric network, connect the app through a Gateway adapter, then measure it with a stated benchmark protocol."],
        ],
        [2880, 6480],
    )

    doc.add_heading("7. Things you must not claim", level=1)
    bullet(doc, "Do not say the system is a live government land registry.")
    bullet(doc, "Do not say NIMC or real NIN verification is connected.")
    bullet(doc, "Do not say payments are real or that ownership transfer is legally binding.")
    bullet(doc, "Do not say Fabric, IPFS, Caliper, or a benchmark is complete when it is not.")
    bullet(doc, "Do not quote transaction-per-second, security, usability, or expert-evaluation results that have not been measured.")

    doc.add_heading("8. End the discussion with this", level=1)
    add_callout(
        doc,
        "Your closing statement.",
        "“The project has reached the point where the full land-management workflow can be demonstrated and tested locally. I built it this way first so that the business rules, roles, document verification, and user journey are clear. The next research phase is to move those same rules into a two-organisation Hyperledger Fabric network and measure the result properly.”",
    )

    path = OUT / "BLMS_Supervisor_Defence_Guide.docx"
    doc.save(path)
    return path


if __name__ == "__main__":
    print(build_guide())
