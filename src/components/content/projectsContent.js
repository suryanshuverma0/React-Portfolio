import pixel_studio_img from "../../assets/projects/pixel_studio.png";
import note from "../../assets/projects/note.png";
import library_management from "../../assets/projects/library_management.png";
import pneumoniaImg from "../../assets/projects/pneumonia.jpg";
import interview from "../../assets/projects/interview.png";
import InstantDomainChecker from "../../assets/projects/instant_domain_checker.png";
import voting from "../../assets/projects/voting.png";

import resnet101Confusion from "../../assets/graphs/resnet101_confusion_matrix.png";
import resnet101Roc from "../../assets/graphs/resnet101_roc_curve.png";
import resnet101Metrics from "../../assets/graphs/resnet101_training_metrics.png";
import customCnnConfusion from "../../assets/graphs/custom_cnn_confusion_matrix.png";
import customCnnRoc from "../../assets/graphs/custom_cnn_roc_curve.png";
import customCnnMetrics from "../../assets/graphs/custom_cnn_training_metrics.png";
import normalOutput from "../../assets/samples/normalOutput.jpg";
import pneumoniaOutput from "../../assets/samples/pneumoniaOutput.jpg";

import acknowledgeShipment from "../../assets/projects/major/acknowledge_shipmen.png";

import adminDashboard from "../../assets/projects/major/admin_dashboard.png";

import adminManufacturer from "../../assets/projects/major/admin_manufacturer.png";

import batchRegistry from "../../assets/projects/major/batch_registry.png";

import blockchainActivity from "../../assets/projects/major/blockchain_activity.png";

import distributorDashboard from "../../assets/projects/major/distributor_dashboard.png";

import etherscan from "../../assets/projects/major/etherscan.png";

import fakeQrMedicine from "../../assets/projects/major/fake_qr_medicine.png";

import genuineMedicineJourney from "../../assets/projects/major/genuine_medicine_journey.png";

import genuineMedicineOverview from "../../assets/projects/major/genuine_medicine_overview.png";

import locationTracking from "../../assets/projects/major/location_tracking.png";

import manufacturerDashboard from "../../assets/projects/major/manufacturer_dashboard.png";

import pharmacistDashboard from "../../assets/projects/major/pharmacist_dashboard.png";

import productRegistry from "../../assets/projects/major/Product_Registry.png";

import sysArch from "../../assets/projects/major/sys_arch.png";

import userRegistry from "../../assets/projects/major/UserRegistry.png";

export const projectsContent = [
  {
    slug: "pharmaceutical-supply-chain-blockchain",

    featured: true,

    category: "Blockchain",

    title: "Detection of Counterfeit Pharmaceutical Products Using Blockchain",

    description:
      "Developed a blockchain-powered pharmaceutical supply chain platform to improve transparency, traceability, and counterfeit medicine prevention using Ethereum smart contracts. The system enables secure batch registration, shipment tracking, QR-based product verification, and role-based access control across manufacturers, distributors, pharmacists, admins, and consumers. A hybrid on-chain/off-chain architecture was implemented to balance scalability, transparency, and transaction cost efficiency.",

    thumbnail: genuineMedicineOverview,

    gallery: [
      sysArch,
      adminDashboard,
      manufacturerDashboard,
      distributorDashboard,
      pharmacistDashboard,
      adminManufacturer,
      blockchainActivity,
      etherscan,
      locationTracking,
      acknowledgeShipment,
      batchRegistry,
      productRegistry,
      userRegistry,
      genuineMedicineOverview,
      genuineMedicineJourney,
      fakeQrMedicine,
    ],

    architectureImages: [sysArch, batchRegistry, productRegistry, userRegistry],

    features: [
      "Counterfeit medicine detection",
      "QR-based product verification",
      "Role-based access control",
      "Batch registration and shipment tracking",
      "Wallet Authentication using MetaMask",
      "Hybrid on-chain/off-chain architecture",
      "Immutable blockchain transaction history",
      "Ethereum Sepolia Ethereum",
      "SHA-256 Based QR Verification",
      "Multi Contract Architecture",
    ],

    technologies: [
      "React.js",
      "Node.js",
      "Express.js",
      "MongoDB",
      "Solidity",
      "Ethereum",
      "Ethers.js",
      "Hardhat",
      "MetaMask",
      "Infura",
      "Tailwind CSS",
      "Cloudinary",
      "Sepolia Testnet",
    ],

    evaluation: [
      {
        label: "Batch Registration Gas",
        value: "964,895",
      },

      {
        label: "Product Registration Gas",
        value: "768,841",
      },

      {
        label: "Shipment Update Gas",
        value: "194,165",
      },

      {
        label: "Distributor Verification Gas",
        value: "80,728",
      },

      {
        label: "Pharmacist Verification Gas",
        value: "46,623",
      },

      {
        label: "Batch Registration Latency",
        value: "0.0026s",
      },

      {
        label: "Product Registration Latency",
        value: "0.0034s",
      },

      {
        label: "Shipment Update Latency",
        value: "0.0026s",
      },

      {
        label: "Distributor Verification Latency",
        value: "0.0010s",
      },

      {
        label: "Pharmacist Verification Latency",
        value: "0.0020s",
      },

      {
        label: "Sepolia Batch Confirmation",
        value: "12.01s",
      },

      {
        label: "Sepolia Product Confirmation",
        value: "15.94s",
      },

      {
        label: "Sepolia Shipment Confirmation",
        value: "28.19s",
      },
    ],

    challenges: [
      "Reducing blockchain gas consumption",
      "Designing scalable smart contract architecture",
      "Maintaining synchronization between on-chain and off-chain data",
      "Implementing secure role-based authorization",
      "Handling blockchain transaction latency",
      "Generating tamper-resistant QR verification workflow",
    ],

    learnings: [
      "Ethereum smart contract development",
      "Multi-contract blockchain architecture",
      "Hybrid blockchain storage design",
      "Role-based access control implementation",
      "Blockchain performance evaluation",
      "QR-based verification workflows",
      "Supply chain traceability system design",
      "Production-oriented MERN and Web3 integration",
    ],

    githubUrl: "https://github.com/suryanshuverma0/PharmaTrace",

    liveUrl: "https://pharmatrace.vercel.app/",
  },

  {
    slug: "pneumonia-detection-system",

    featured: true,

    category: "Artificial Intelligence",

    title: "Deep Learning Pneumonia Detection System",

    description:
      "Developed an AI-powered pneumonia detection system as part of a team of three using Custom CNN and ResNet-101V2 models to classify chest X-ray images as Pneumonia or Normal with probability-based predictions. The system also included Grad-CAM visualizations for interpretability and performance evaluation workflows for reliable medical analysis.",

    thumbnail: pneumoniaImg,

    gallery: [
      pneumoniaImg,
      resnet101Confusion,
      resnet101Metrics,
      resnet101Roc,
      customCnnConfusion,
      customCnnRoc,
      customCnnMetrics,
      normalOutput,
      pneumoniaOutput,
    ],

    architectureImages: [pneumoniaImg, resnet101Metrics, customCnnMetrics],

    features: [
      "Deep learning-based pneumonia prediction",
      "Chest X-ray classification",
      "Custom CNN and ResNet-101V2 models",
      "Grad-CAM visualization support",
      "Probability-based prediction",
      "Medical image preprocessing",
      "ROC curve and confusion matrix evaluation",
      "Performance analysis workflow",
    ],

    technologies: ["Python", "TensorFlow", "Keras", "OpenCV", "NumPy", "Flask"],

    evaluation: [
      {
        label: "ResNet101V2 Accuracy",
        value: "95.28%",
      },

      {
        label: "ResNet101V2 ROC-AUC",
        value: "0.9883",
      },

      {
        label: "ResNet101V2 Precision",
        value: "95.47%",
      },

      {
        label: "ResNet101V2 Recall",
        value: "95.28%",
      },

      {
        label: "ResNet101V2 F1 Score",
        value: "95.33%",
      },

      {
        label: "Custom CNN Accuracy",
        value: "96.05%",
      },

      {
        label: "Custom CNN ROC-AUC",
        value: "0.9957",
      },

      {
        label: "Custom CNN Precision",
        value: "96.47%",
      },

      {
        label: "Custom CNN Recall",
        value: "96.05%",
      },

      {
        label: "Custom CNN F1 Score",
        value: "96.12%",
      },
    ],

    challenges: [
      "Medical dataset preprocessing",
      "Preventing model overfitting",
      "Model optimization and tuning",
      "Medical image normalization",
      "Balancing prediction accuracy",
      "Model interpretability",
    ],

    learnings: [
      "CNN architecture implementation",
      "Transfer learning with ResNet101V2",
      "Medical image analysis workflows",
      "Deep learning model evaluation",
      "Grad-CAM visualization techniques",
      "Performance metric interpretation",
    ],

    githubUrl: "https://github.com/suryanshuverma0/PneumoniaDetectionSystem",
  },

  {
    slug: "multi-election-voting-system",

    featured: true,

    category: "Blockchain",

    title: "Multi Election Voting System",

    description:
      "Developed a decentralized multi-election voting platform using Ethereum smart contracts to provide transparent, tamper-resistant, and secure digital voting. The system supports election management, candidate management, wallet-based voting, role-based access control, and real-time blockchain transaction feedback through a React-based frontend integrated with the Ethereum Sepolia testnet.",

    thumbnail: voting,

    gallery: [voting],

    architectureImages: [voting],

    features: [
      "Multi-election management",
      "Candidate registration and removal",
      "Secure blockchain-based voting",
      "Wallet authentication using MetaMask",
      "Role-based admin and voter access",
      "Real-time transaction feedback",
      "Read-only blockchain data access",
      "Election cancellation and deadline management",
    ],

    technologies: [
      "React.js",
      "Tailwind CSS",
      "Ethereum",
      "Solidity",
      "Ethers.js",
      "Hardhat",
      "MetaMask",
      "Sepolia Testnet",
      "Mocha",
    ],

    evaluation: [
      {
        label: "Total Tests",
        value: "20",
      },

      {
        label: "Passed Tests",
        value: "20/20",
      },

      {
        label: "Total Gas Used",
        value: "478,133",
      },

      {
        label: "Election Creation Gas",
        value: "97,175",
      },

      {
        label: "Candidate Creation Gas",
        value: "77,829",
      },

      {
        label: "Voting Transaction Gas",
        value: "75,980",
      },

      {
        label: "Election Deletion Gas",
        value: "32,396",
      },

      {
        label: "Deadline Update Gas",
        value: "33,619",
      },
    ],

    challenges: [
      "Designing secure voting smart contracts",
      "Preventing duplicate voting",
      "Managing blockchain transaction feedback",
      "Handling gas optimization",
      "Implementing role-based access control",
      "Synchronizing frontend state with blockchain state",
    ],

    learnings: [
      "Ethereum smart contract development",
      "Gas optimization techniques",
      "Smart contract testing with Hardhat and Mocha",
      "Wallet-based authentication workflows",
      "Blockchain state management",
      "Decentralized application architecture",
      "Role-based permission handling",
      "Frontend and blockchain interaction using Ethers.js",
    ],

    githubUrl:
      "https://github.com/suryanshuverma0/Multi-Election-Voting-System",

    liveUrl: "https://multi-election-voting-system.netlify.app/",
  },

  {
    slug: "pixel-studio",

    featured: false,

    category: "Frontend",

    title: "Pixel Studio",

    description:
      "Built a creative drawing platform featuring pixel art tools, freehand canvas drawing, authentication, and color-based editing workflows.",

    thumbnail: pixel_studio_img,

    gallery: [pixel_studio_img],

    features: [
      "Pixel art editor",
      "Canvas drawing tools",
      "User authentication",
      "Color picker integration",
      "Interactive UI workflow",
    ],

    technologies: ["React", "Firebase", "Tailwind CSS", "HTML Canvas"],

    githubUrl: "https://github.com/suryanshuverma0/pixel-studio",

    liveUrl: "https://pixelstudio-2e0bd.web.app/",
  },

  {
    slug: "note-mania",

    featured: false,

    category: "Full Stack",

    title: "NoteMania",

    description:
      "Developed a note-taking platform with Firebase integration allowing users to create, manage, and export notes efficiently.",

    thumbnail: note,

    gallery: [note],

    features: [
      "Note management system",
      "Firebase authentication",
      "Cloud database integration",
      "PDF export support",
      "Responsive interface",
    ],

    technologies: ["React", "Firebase", "Tailwind CSS"],

    githubUrl: "https://note-taking-application-f1180.web.app/notes",

    liveUrl: "https://note-taking-application-f1180.web.app/notes",
  },

  {
    slug: "ai-interview-mocker",

    featured: false,

    category: "Artificial Intelligence",

    title: "AI Interview Mocker",

    description:
      "Built an interview preparation system that generates role-specific interview questions and provides AI-assisted feedback for answers.",

    thumbnail: interview,

    gallery: [interview],

    features: [
      "AI-generated interview questions",
      "Role-based interview flow",
      "Answer feedback system",
      "Interview practice workflow",
    ],

    technologies: ["React", "JavaScript"],

    githubUrl: "https://github.com/suryanshuverma0/Library-Management-System",

    liveUrl: "https://ai-interview-moker.vercel.app/",
  },

  {
    slug: "library-management-system",

    featured: false,

    category: "Software Engineering",

    title: "Library Management System",

    description:
      "Developed a command-line library management system with separate workflows for students and teachers, focused on learning Object-Oriented Programming fundamentals.",

    thumbnail: library_management,

    gallery: [library_management],

    features: [
      "Teacher and student dashboards",
      "Book ordering workflow",
      "Fine tracking system",
      "File-based data storage",
      "CLI interaction system",
    ],

    technologies: ["C++", "OOP", "File Handling"],

    githubUrl: "https://github.com/suryanshuverma0/Library-Management-System",
  },

  {
    slug: "instant-domain-checker",

    featured: false,

    category: "Full Stack",

    title: "Instant Domain Checker",

    description:
      "Built a fast domain availability checking platform designed for developers, startups, and entrepreneurs searching for domain names.",

    thumbnail: InstantDomainChecker,

    gallery: [InstantDomainChecker],

    features: [
      "Real-time domain checking",
      "Fast search workflow",
      "Responsive UI",
      "MERN stack integration",
    ],

    technologies: ["React", "Node.js", "Express.js", "MongoDB"],

    githubUrl:
      "https://github.com/suryanshuverma0/instant-domain-checker/tree/main/instant-domain-checker",

    liveUrl: "https://instant-domain-checker.vercel.app/",
  },
];
