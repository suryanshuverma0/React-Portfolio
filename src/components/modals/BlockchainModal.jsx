
import PropTypes from "prop-types";

import QRCode from "react-qr-code";

import {
  FaTimes,
  FaShieldAlt,
  FaExternalLinkAlt,
} from "react-icons/fa";

import {
  motion,
  AnimatePresence,
} from "framer-motion";

function BlockchainModal({
  isOpen,
  onClose,
  blockchain,
}) {

  if (!isOpen)
    return null;

  return (

    <AnimatePresence>

      <motion.div

        initial={{
          opacity: 0,
        }}

        animate={{
          opacity: 1,
        }}

        exit={{
          opacity: 0,
        }}

        onClick={onClose}

        className="
          fixed
          inset-0

          z-[999]

          flex
          items-center
          justify-center

          bg-black/60

          backdrop-blur-md

          p-4
        "
      >

        {/* MODAL */}

        <motion.div

          initial={{
            opacity: 0,
            scale: 0.96,
            y: 10,
          }}

          animate={{
            opacity: 1,
            scale: 1,
            y: 0,
          }}

          exit={{
            opacity: 0,
            scale: 0.96,
            y: 10,
          }}

          transition={{
            duration: 0.2,
          }}

          onClick={(e) =>
            e.stopPropagation()
          }

          className="
            relative

            w-full
            max-w-sm

            overflow-hidden

            rounded-3xl

            border
            border-border

            bg-card

            p-5
            sm:p-6

            shadow-[0_20px_80px_rgba(0,0,0,0.18)]
          "
        >

          {/* GLOW */}

          <div
            className="
              absolute

              top-0
              right-0

              h-28
              w-28

              rounded-full

              bg-emerald-500/10

              blur-3xl

              pointer-events-none
            "
          />

          {/* CLOSE */}

          <button

            type="button"

            onClick={onClose}

            className="
              absolute
              top-4
              right-4

              z-20

              h-9
              w-9

              rounded-xl

              glass
              glass-hover

              flex
              items-center
              justify-center
            "
          >

            <FaTimes
              size={12}
            />

          </button>

          {/* CONTENT */}

          <div
            className="
              relative

              flex
              flex-col
              items-center

              text-center
            "
          >

            {/* ICON */}

            <div
              className="
                h-14
                w-14

                rounded-2xl

                bg-emerald-500/10

                border
                border-emerald-500/20

                flex
                items-center
                justify-center

                text-emerald-500

                mb-4
              "
            >

              <FaShieldAlt
                size={22}
              />

            </div>

            {/* TITLE */}

            <h2
              className="
                text-title

                mb-2
              "
            >

              On-Chain Verification

            </h2>

            {/* SUBTEXT */}

            <p
              className="
                text-small

                max-w-xs

                mb-6
              "
            >

              Smart contract deployed on
              Polygon verifying this
              portfolio deployment.

            </p>

            {/* QR */}

            <div
              className="
                rounded-2xl

                bg-white

                border
                border-border

                p-3

                mb-6

                shadow-sm
              "
            >

              <QRCode

                value={
                  blockchain
                    .verifyUrl
                }

                size={150}

                bgColor="#FFFFFF"

                fgColor="#000000"
              />

            </div>

            {/* ADDRESS */}

            <div
              className="
                w-full

                rounded-2xl

                border
                border-border

                bg-surface

                p-4

                text-left

                mb-6
              "
            >

              <p
                className="
                  text-muted

                  uppercase

                  tracking-[0.16em]

                  mb-2
                "
              >

                Contract Address

              </p>

              <p
                className="
                  text-mono

                  break-all
                "
              >

                {
                  blockchain
                    .address
                }

              </p>

            </div>

            {/* BUTTON */}

            <a

              href={
                blockchain
                  .polygonScanUrl
              }

              target="_blank"

              rel="noreferrer"

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

                hover:opacity-90

                transition-all
              "
            >

              Open PolygonScan

              <FaExternalLinkAlt
                size={12}
              />

            </a>

          </div>

        </motion.div>

      </motion.div>

    </AnimatePresence>
  );
}

BlockchainModal.propTypes = {

  isOpen:
    PropTypes.bool.isRequired,

  onClose:
    PropTypes.func.isRequired,

  blockchain:
    PropTypes.shape({

      verifyUrl:
        PropTypes.string
          .isRequired,

      address:
        PropTypes.string
          .isRequired,

      polygonScanUrl:
        PropTypes.string
          .isRequired,
    }).isRequired,
};

export default BlockchainModal;
