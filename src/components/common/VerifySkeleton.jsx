import Container
from "../ui/Container";

function VerifySkeleton() {

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

          <div
            className="
              h-8
              w-44

              rounded-full

              bg-surface

              animate-pulse

              mb-6
            "
          />

          <div
            className="
              h-16
              md:h-24

              w-full

              rounded-3xl

              bg-surface

              animate-pulse

              mb-5
            "
          />

          <div
            className="
              h-6
              w-3/4

              rounded-2xl

              bg-surface

              animate-pulse
            "
          />

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

          {[1, 2, 3].map(
            (item) => (

              <div
                key={item}

                className="
                  card

                  animate-pulse
                "
              >

                <div
                  className="
                    h-4
                    w-20

                    rounded-full

                    bg-surface

                    mb-4
                  "
                />

                <div
                  className="
                    h-8
                    w-32

                    rounded-2xl

                    bg-surface
                  "
                />

              </div>

            )
          )}

        </div>

        {/* MAIN */}

        <div
          className="
            grid

            grid-cols-1
            lg:grid-cols-[1fr_320px]

            gap-5
          "
        >

          {/* LEFT */}

          <div
            className="
              card

              animate-pulse
            "
          >

            <div
              className="
                flex
                flex-col

                gap-5
              "
            >

              {[1, 2, 3, 4, 5].map(
                (item) => (

                  <div
                    key={item}
                  >

                    <div
                      className="
                        h-4
                        w-24

                        rounded-full

                        bg-surface

                        mb-3
                      "
                    />

                    <div
                      className="
                        h-14

                        rounded-2xl

                        bg-surface
                      "
                    />

                  </div>

                )
              )}

            </div>

          </div>

          {/* RIGHT */}

          <div
            className="
              card

              animate-pulse
            "
          >

            <div
              className="
                h-5
                w-36

                rounded-full

                bg-surface

                mb-6
              "
            />

            <div
              className="
                flex
                flex-col

                gap-6
              "
            >

              {[1, 2, 3].map(
                (item) => (

                  <div
                    key={item}
                  >

                    <div
                      className="
                        h-5
                        w-40

                        rounded-full

                        bg-surface

                        mb-3
                      "
                    />

                    <div
                      className="
                        h-12

                        rounded-2xl

                        bg-surface
                      "
                    />

                  </div>

                )
              )}

            </div>

          </div>

        </div>

      </Container>

    </main>
  );
}

export default VerifySkeleton;