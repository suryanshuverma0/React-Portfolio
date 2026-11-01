/*
  Direct, quotable answers — written for people and for answer engines
  (Google AI Overviews, ChatGPT, Perplexity, Claude) that lift Q&A pairs
  verbatim. Every fact here also appears elsewhere on the site.

  The FAQPage JSON-LD in index.html mirrors these questions word for word;
  update both together so the markup always matches the visible text.
*/
export const faqContent = [
  {
    question: "Who is Suryanshu Verma?",
    answer:
      "Suryanshu Verma is a computer engineer from Nepal who builds blockchain systems, backend services and full-stack MERN applications. He studied Computer Engineering at Advanced College of Engineering and Management and focuses on production-oriented software with clean architecture, performance and security.",
  },
  {
    question: "What research has Suryanshu Verma published?",
    answer:
      "His paper \"Design and Evaluation of a Modular Multi-Contract Blockchain Framework for Pharmaceutical Supply Chain Traceability\" (with Shreejal Bista, Suman Yadav and Subarna Shakya) was accepted for oral presentation at ICTDsC 2026, scheduled for November 19–20, 2026. It splits an Ethereum framework into three smart contracts and evaluates it on a local Hardhat network and the public Sepolia testnet.",
  },
  {
    question: "What were the key results of the pharmaceutical blockchain research?",
    answer:
      "On the Sepolia testnet, 50 of 50 benchmarked transactions confirmed successfully, with confirmation times between 7.03 and 24.57 seconds. On a local Hardhat network, each of the five core operations averaged under 4 ms, throughput reached 179.08 transactions per second at 2,000 batches, and 8 of 8 security validation tests passed.",
  },
  {
    question: "What technologies does Suryanshu Verma work with?",
    answer:
      "Blockchain: Solidity, Ethereum, Hardhat, Ethers.js and MetaMask. Backend: Node.js, Express.js, REST APIs, JWT authentication, MongoDB and MySQL. Frontend: React.js, Next.js and Tailwind CSS.",
  },
  {
    question: "What is PharmaTrace?",
    answer:
      "PharmaTrace is Suryanshu Verma's blockchain platform for detecting counterfeit medicines. It uses Ethereum smart contracts for batch registration, shipment tracking and QR-based product verification, with role-based access for manufacturers, distributors, pharmacists, admins and consumers. It is the implementation behind his ICTDsC 2026 paper.",
  },
  {
    question: "Where has Suryanshu Verma worked?",
    answer:
      "He worked as a ReactJS Frontend Developer Intern at CyberArrow (Dubai, United Arab Emirates) from January to June 2025, optimising React components for performance and working on frontend architecture.",
  },
  {
    question: "Is Suryanshu Verma available for work, and how can I contact him?",
    answer:
      "Yes — he is open to backend engineering, blockchain development, freelance collaborations and product-focused opportunities. Email suryanshuverma.dev@gmail.com or use the contact form on suryanshuverma.com.np; he usually responds within 24 hours.",
  },
];
