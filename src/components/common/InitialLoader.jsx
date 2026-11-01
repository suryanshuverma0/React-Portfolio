import PropTypes from "prop-types";

import { motion, AnimatePresence } from "framer-motion";

const EASE = [0.22, 1, 0.36, 1];

const NAME = "Suryanshu Verma";

/*
  First-paint screen. The name rises letter by letter from a mask — the
  same move the hero uses — with the wordmark's live dot and a hairline
  that sweeps while settings load. On exit the whole screen lifts away
  like a curtain, revealing the hero underneath.
*/
function InitialLoader({ loading }) {
  const year = new Date().getFullYear();

  return (
    <AnimatePresence>
      {loading && (
        <motion.div
          key="initial-loader"
          initial={{ y: 0 }}
          exit={{ y: "-100%" }}
          transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
          className="
            fixed
            inset-0

            z-[9999]

            bg-background

            flex
            items-center
            justify-center

            overflow-hidden
          "
          role="status"
          aria-label="Loading"
        >
          {/* BACKDROP */}

          <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-grid mask-radial" />

          <div className="relative flex flex-col items-center px-6">
            {/* NAME */}

            <h1
              aria-label={NAME}
              className="
                flex
                items-center

                gap-3
                md:gap-4

                text-[clamp(2.4rem,9vw,5.5rem)]

                font-semibold

                leading-none

                tracking-[-0.06em]
              "
            >
              <motion.span
                aria-hidden="true"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, ease: EASE }}
                className="relative flex h-[0.16em] w-[0.16em] shrink-0"
              >
                <span className="absolute inline-flex h-full w-full rounded-full bg-primary opacity-40 animate-ping" />
                <span className="relative inline-flex h-full w-full rounded-full bg-primary" />
              </motion.span>

              <span aria-hidden="true" className="flex overflow-hidden pb-[0.12em] -mb-[0.12em]">
                {NAME.split("").map((char, index) => (
                  <motion.span
                    key={`${char}-${index}`}
                    initial={{ y: "110%" }}
                    animate={{ y: 0 }}
                    transition={{ duration: 0.65, delay: 0.1 + index * 0.025, ease: EASE }}
                    className="inline-block whitespace-pre"
                  >
                    {char}
                  </motion.span>
                ))}
              </span>
            </h1>

            {/* PROGRESS */}

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mt-8 md:mt-10 w-full max-w-[280px]"
            >
              <div aria-hidden="true" className="relative h-px w-full overflow-hidden bg-border">
                <motion.span
                  className="absolute inset-y-0 left-0 w-1/3 bg-primary"
                  initial={{ x: "-100%" }}
                  animate={{ x: "300%" }}
                  transition={{ duration: 1.4, ease: "easeInOut", repeat: Infinity }}
                />
              </div>

              <div className="mt-4 flex items-center justify-between">
                <span className="text-eyebrow">Portfolio</span>
                <span className="text-eyebrow tabular-nums">©{year}</span>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

InitialLoader.propTypes = {
  loading: PropTypes.bool,
};

export default InitialLoader;
