import {
  useEffect,
  useState,
} from "react";

import {
  ethers,
} from "ethers";

import {
  ArrowUpRight,
  CheckCircle2,
  Copy,
} from "lucide-react";

import Container
from "../components/ui/Container";

import {
  CONTRACT_ADDRESS,
  CONTRACT_ABI,
} from "../blockchain/contract";

import VerifySkeleton from "../components/common/VerifySkeleton"
function VerifyPage() {

  const [data,
    setData] =
      useState(null);

  const [loading,
    setLoading] =
      useState(true);

  const [networkStatus,
    setNetworkStatus] =
      useState("Connecting");

  /* ========================================
     FETCH DATA
  ========================================= */

  useEffect(() => {

    const fetchBlockchainData =
      async () => {

        try {

          const provider =
            new ethers.JsonRpcProvider(

              "https://rpc-amoy.polygon.technology"
            );

          const blockNumber =
            await provider.getBlockNumber();

          if (blockNumber) {

            setNetworkStatus(
              "Connected"
            );
          }

          const contract =
            new ethers.Contract(

              CONTRACT_ADDRESS,

              CONTRACT_ABI,

              provider
            );

          const developerName =
            await contract.developerName();

          const portfolioTitle =
            await contract.portfolioTitle();

          const github =
            await contract.github();

          const portfolioUrl =
            await contract.portfolioUrl();

          const deployedAt =
            await contract.deployedAt();

          const owner =
            await contract.owner();

          setData({

            developerName,

            portfolioTitle,

            github,

            portfolioUrl,

            deployedAt:
              Number(deployedAt),

            owner,

            blockNumber,
          });

        } catch (error) {

          console.error(error);

          setNetworkStatus(
            "Failed"
          );

        } finally {

          setLoading(false);
        }
      };

    fetchBlockchainData();

  }, []);

  /* ========================================
     COPY ADDRESS
  ========================================= */

  const copyAddress =
    async () => {

      await navigator.clipboard.writeText(
        CONTRACT_ADDRESS
      );
    };

  /* ========================================
     LOADING
  ========================================= */

  if (loading) {

    return <VerifySkeleton/>
  }

  /* ========================================
     PAGE
  ========================================= */

  return (

    <main
      className="
        section
      "
    >

      <Container>

        {/* HERO */}

        <div
          className="
            max-w-4xl

            mb-12
          "
        >

          {/* BADGE */}

          <div
            className="
              inline-flex
              items-center

              gap-2

              px-3
              py-1.5

              rounded-full

              border
              border-border

              bg-surface

              text-small

              mb-6
            "
          >

            <CheckCircle2
              size={16}
            />

            Blockchain Verified

          </div>

          {/* TITLE */}

          <h1
            className="
              text-hero

              mb-5
            "
          >

            Immutable portfolio verification powered by blockchain.

          </h1>

          {/* DESCRIPTION */}

          <p
            className="
              text-large
            "
          >

            Live smart contract metadata fetched directly from Polygon Amoy network verifying portfolio authenticity, ownership, and deployment integrity.

          </p>

        </div>

        {/* STATUS */}

        <div
          className="
            grid

            grid-cols-1
            sm:grid-cols-3

            gap-4

            mb-12
          "
        >

          <StatusCard
            label="Network"
            value="Polygon Amoy"
          />

          <StatusCard
            label="Verification"
            value={networkStatus}
          />

          <StatusCard
            label="Latest Block"
            value={data?.blockNumber}
          />

        </div>

        {/* MAIN GRID */}

        <div
          className="
            grid

            grid-cols-1
            lg:grid-cols-[1fr_320px]

            gap-5

            mb-12
          "
        >

          {/* LEFT */}

          <div
            className="
              card
            "
          >

            <div
              className="
                flex
                flex-col

                gap-5
              "
            >

              <InfoItem
                label="Developer"
                value={data?.developerName}
              />

              <InfoItem
                label="Portfolio"
                value={data?.portfolioTitle}
              />

              <InfoItem
                label="GitHub"
                value={data?.github}
              />

              <InfoItem
                label="Portfolio URL"
                value={data?.portfolioUrl}
              />

              <InfoItem
                label="Wallet Owner"
                value={data?.owner}
              />

              <InfoItem
                label="Deployment Timestamp"
                value={
                  new Date(
                    data?.deployedAt * 1000
                  ).toLocaleString()
                }
              />

            </div>

          </div>

          {/* RIGHT */}

          <div
            className="
              card

              h-fit

              lg:sticky
              lg:top-28
            "
          >

            <p
              className="
                text-muted

                uppercase

                tracking-[0.18em]

                mb-5
              "
            >

              Verification Details

            </p>

            <div
              className="
                flex
                flex-col

                gap-5
              "
            >

              <SidebarItem
                title="Immutable Ownership"
                description="
                  Smart contract ownership permanently tied to blockchain wallet identity.
                "
              />

              <SidebarItem
                title="Live RPC Validation"
                description={`
                  Current network status:
                  ${networkStatus}
                `}
              />

              <SidebarItem
                title="Decentralized Trust"
                description="
                  Portfolio authenticity verified through blockchain deployment.
                "
              />

            </div>

          </div>

        </div>

        {/* CONTRACT */}

        <div
          className="
            card

            mb-12
          "
        >

          <div
            className="
              flex
              flex-col
              md:flex-row

              md:items-center
              md:justify-between

              gap-5
            "
          >

            {/* LEFT */}

            <div>

              <p
                className="
                  text-muted

                  uppercase

                  tracking-[0.18em]

                  mb-3
                "
              >

                Contract Address

              </p>

              <p
                className="
                  text-small

                  break-all

                  font-mono
                "
              >

                {CONTRACT_ADDRESS}

              </p>

            </div>

            {/* ACTIONS */}

            <div
              className="
                flex
                flex-wrap

                gap-3
              "
            >

              {/* COPY */}

              <button

                onClick={
                  copyAddress
                }

                className="
                  h-control

                  px-control

                  rounded-control

                  border
                  border-border

                  bg-surface

                  inline-flex
                  items-center
                  justify-center

                  gap-2

                  text-label

                  transition-all
                  duration-300

                  hover:bg-background
                "
              >

                <Copy size={16} />

                Copy

              </button>

              {/* VIEW */}

              <a

                href={`https://amoy.polygonscan.com/address/${CONTRACT_ADDRESS}`}

                target="_blank"

                rel="noopener noreferrer"

                className="
                  h-control

                  px-control

                  rounded-control

                  bg-primary

                  text-background

                  inline-flex
                  items-center
                  justify-center

                  gap-2

                  text-label

                  transition-all
                  duration-300

                  hover:opacity-90
                "
              >

                View Contract

                <ArrowUpRight
                  size={16}
                />

              </a>

            </div>

          </div>

        </div>

      </Container>

    </main>
  );
}

/* ========================================
   STATUS CARD
======================================== */

function StatusCard({
  label,
  value,
}) {

  return (

    <div
      className="
        card
      "
    >

      <p
        className="
          text-muted

          mb-3
        "
      >

        {label}

      </p>

      <h2
        className="
          text-title

          break-all
        "
      >

        {value}

      </h2>

    </div>

  );
}

/* ========================================
   INFO ITEM
======================================== */

function InfoItem({
  label,
  value,
}) {

  return (

    <div>

      <p
        className="
          text-muted

          mb-2
        "
      >

        {label}

      </p>

      <div
        className="
          rounded-2xl

          border
          border-border

          bg-surface

          p-4

          text-small

          break-all
        "
      >

        {value}

      </div>

    </div>

  );
}

/* ========================================
   SIDEBAR ITEM
======================================== */

function SidebarItem({
  title,
  description,
}) {

  return (

    <div>

      <h3
        className="
          text-label

          mb-2
        "
      >

        {title}

      </h3>

      <p
        className="
          text-small
        "
      >

        {description}

      </p>

    </div>

  );
}

export default VerifyPage;
