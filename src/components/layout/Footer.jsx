import Container from "../ui/Container";

function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer
      className="
        border-t
        border-border
      "
    >
      <Container>
        <div
          className="
            py-8

            flex
            flex-col
            md:flex-row

            items-center
            justify-between

            gap-6
          "
        >
          {/* LEFT */}

          <div
            className="
              flex
              flex-col

              items-center
              md:items-start

              gap-2
            "
          >
            <div
              className="
                flex
                items-center

                gap-3
              "
            >
              <div
                className="
                  h-10
                  w-10

                  rounded-xl

                  bg-primary

                  text-background

                  flex
                  items-center
                  justify-center

                  text-sm
                  font-semibold
                "
              >
                SV
              </div>

              <div>
                <p
                  className="
                    text-label
                  "
                >
                  Suryanshu Verma
                </p>

                <p
                  className="
                    text-small
                  "
                >
                  Computer Engineer
                </p>
              </div>
            </div>
          </div>

          {/* CENTER */}

          <div
            className="
              text-center
            "
          >
            <p
              className="
                text-small
              "
            >
              © {year} Suryanshu Verma. All rights reserved.
            </p>
          </div>

          {/* RIGHT */}

          <div
            className="
              flex
              items-center

              gap-3
            "
          ></div>
        </div>
      </Container>
    </footer>
  );
}

export default Footer;
