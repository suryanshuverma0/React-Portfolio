import { useState, useEffect } from "react";
import Container from "../ui/Container";
import { getPublicSettings } from "../../services/public.settings.service";
import { socialsObjectToArray } from "../../lib/socials";
import { iconMap } from "../constants/iconMap";

function Footer() {
  const year = new Date().getFullYear();
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const data = await getPublicSettings();

        setSettings(data);
      } catch (error) {
        console.error("Failed to load settings", error);
      }
    };

    loadSettings();
  }, []);

  const footerName = settings?.footerName || "Suryanshu Verma";
  const footerRole = settings?.footerRole || "Computer Engineer";
  const socials = socialsObjectToArray(settings?.socials);

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
                  {footerName}
                </p>

                <p
                  className="
                    text-small
                  "
                >
                  {footerRole}
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
              © {year} {footerName}. All rights reserved.
            </p>
          </div>

          {/* RIGHT */}

          <div
            className="
              flex
              items-center

              gap-3
            "
          >
            {socials.map((item) => {
              const Icon = iconMap[item.icon];

              if (!Icon) return null;

              return (
                <a
                  key={item.icon}
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  className="
                    h-9
                    w-9

                    rounded-xl

                    bg-surface

                    border
                    border-border

                    flex
                    items-center
                    justify-center

                    text-secondary

                    transition-all
                    duration-300

                    hover:text-primary
                    hover:bg-background
                  "
                >
                  <Icon size={15} />
                </a>
              );
            })}
          </div>
        </div>
      </Container>
    </footer>
  );
}

export default Footer;
