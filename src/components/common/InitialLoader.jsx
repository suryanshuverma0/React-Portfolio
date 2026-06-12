import {
  motion,
  AnimatePresence,
} from "framer-motion";

function InitialLoader({
  loading,
}) {

  return (

    <AnimatePresence>

      {loading && (

        <motion.div

          initial={{
            opacity: 1,
          }}

          exit={{
            opacity: 0,
          }}

          transition={{
            duration: 0.5,
          }}

          className="
            fixed
            inset-0

            z-[9999]

            bg-background

            flex
            items-center
            justify-center
          "
        >

          <motion.div

            initial={{
              opacity: 0,
              y: 10,
            }}

            animate={{
              opacity: 1,
              y: 0,
            }}

            transition={{
              duration: 0.5,
            }}

            className="
              text-center
            "
          >

            {/* NAME */}

            <h1
              className="
                text-3xl
                md:text-5xl

                font-semibold

                tracking-[-0.06em]

                mb-4
              "
            >

              Suryanshu Verma

            </h1>

            {/* SUBTEXT */}

            <p
              className="
                text-small

                tracking-[0.18em]

                uppercase
              "
            >

              Building scalable systems

            </p>

          </motion.div>

        </motion.div>

      )}

    </AnimatePresence>

  );
}

export default InitialLoader;
