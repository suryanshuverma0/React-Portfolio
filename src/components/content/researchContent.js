/*
  Research entries. Figures are taken from the paper itself — keep local
  (Hardhat) and public-network (Sepolia) results labelled separately so
  neither is read as the other.
*/
export const researchContent = [
  {
    id: "multi-contract-pharma-traceability",

    title:
      "Design and Evaluation of a Modular Multi-Contract Blockchain Framework for Pharmaceutical Supply Chain Traceability",

    status: "Accepted for oral presentation",

    venue: "ICTDsC 2026",

    paperId: "162",

    schedule: "Scheduled for Nov 19–20, 2026",

    authors: [
      { name: "Suryanshu Verma", self: true },
      { name: "Shreejal Bista" },
      { name: "Suman Yadav" },
      { name: "Subarna Shakya" },
    ],

    summary:
      "Pharmaceutical supply chains often depend on a single authority for manufacturing, shipment, and verification records, which leaves those records open to tampering. The paper proposes an Ethereum framework split into three smart contracts for stakeholder authorization, batch lifecycle tracking, and product lookup, storing only integrity-sensitive fields on-chain to limit gas cost.",

    // Shown in the collapsed card — the five headline results.
    highlights: [
      {
        environment: "Public testnet · Ethereum Sepolia",

        results: [
          {
            value: "50 / 50",
            label: "Benchmarked transactions confirmed successfully",
          },
          {
            value: "7.03–24.57 s",
            label: "Transaction confirmation time range",
          },
        ],
      },
      {
        environment: "Local benchmark · Hardhat network",

        results: [
          {
            value: "< 4 ms",
            label: "Mean execution latency for each of the five core operations",
          },
          {
            value: "179.08 tx/s",
            label: "Throughput at the largest workload of 2,000 batches",
          },
          {
            value: "8 / 8",
            label: "Application-specific security validation tests passed",
          },
        ],
      },
    ],

    contracts: [
      {
        name: "UserRegistry",
        description: "Stakeholder roles and administrator approval state.",
      },
      {
        name: "BatchRegistry",
        description:
          "Batch lifecycle, shipment events, and distributor and pharmacist verification records.",
      },
      {
        name: "ProductRegistry",
        description:
          "Binds each product to its batch and supports product-level lookup.",
      },
    ],

    contributions: [
      "A modular three-contract architecture that separates authorization, batch lifecycle management, and product verification, so one part can change without redeploying the others.",
      "A hybrid on-chain/off-chain storage model that keeps only integrity-sensitive fields on Ethereum, with profiles in MongoDB and images and documents in Cloudinary.",
      "QR-based consumer lookup: each product's QR code encodes its serial number, which retrieves the associated batch and shipment record.",
      "A four-part evaluation covering latency, gas consumption, scalability up to 2,000 batches, and invalid or unauthorized operations, on both a local Hardhat network and the public Sepolia testnet.",
    ],

    // Average gas per operation, measured on Sepolia (10 runs each).
    gas: [
      { label: "Batch registration", value: "955,113" },
      { label: "Product registration", value: "765,600" },
      { label: "Shipment update", value: "194,177" },
      { label: "Distributor verification", value: "80,740" },
      { label: "Pharmacist verification", value: "46,635" },
    ],

    evaluationNotes: [
      "Local throughput fell from 299.08 tx/s at 100 batches to 179.08 tx/s at 2,000 batches. Transactions were submitted one at a time to a single Hardhat node, and execution time grew almost linearly, consistent with constant-time storage access.",
      "Security tests covered data validity, ownership enforcement, and state consistency in BatchRegistry, including duplicate, non-owner, repeated, and malformed operations.",
    ],

    limitations: [
      "Consumer verification looks up the QR-encoded serial number; the embedded hash is not checked on-chain, so cloning of a valid QR code is not prevented.",
      "Evaluated on Hardhat and the Sepolia testnet only — not on Ethereum mainnet or under concurrent multi-user load.",
      "Security results cover the tested cases; they are not formal verification or a complete smart contract audit.",
    ],

    technologies: [
      "Solidity",
      "Ethereum",
      "Hardhat",
      "Sepolia Testnet",
      "Ethers.js",
      "MetaMask",
      "React.js",
      "Node.js",
      "MongoDB",
      "Cloudinary",
    ],

    githubUrl: "https://github.com/suryanshuverma0/PharmaTrace",

    // Internal link to the matching entry in the Projects section.
    projectSlug: "pharmaceutical-supply-chain-blockchain",
  },
];
