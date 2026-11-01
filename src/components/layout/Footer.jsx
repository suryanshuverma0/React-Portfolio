import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowUp, ArrowUpRight } from "lucide-react";
import Container from "../ui/Container";
import { getPublicSettings } from "../../services/public.settings.service";
import { socialsObjectToArray } from "../../lib/socials";
import { navbarContent } from "../content/navbarContent";
import { contactContent } from "../content/contactContent";

const SOCIAL_LABELS = {
  github: "GitHub",
  linkedin: "LinkedIn",
  twitter: "X / Twitter",
  instagram: "Instagram",
  facebook: "Facebook",
};

function Footer() {
  const year = new Date().getFullYear();
  const [settings, setSettings] = useState(null);

  const location = useLocation();
  const onHomePage = location.pathname === "/";

  useEffect(() => {
    getPublicSettings()
      .then(setSettings)
      .catch((error) => console.error("Failed to load settings", error));
  }, []);

  const footerName = settings?.footerName || "Suryanshu Verma";
  const footerRole = settings?.footerRole || "Computer Engineer";

  const settingsSocials = socialsObjectToArray(settings?.socials);
  const socials = settingsSocials.length ? settingsSocials : contactContent.socials;

  const email = settings?.contactEmail || contactContent.contacts.find((c) => c.type === "email")?.value;

  // Same rule as the navbar: in-page anchors route home first off "/".
  const renderLink = (item) => {
    const isHash = item.href.startsWith("#");

    const className = "text-small hover:text-primary transition-colors";

    if (isHash && onHomePage) {
      return (
        <a href={item.href} className={className}>
          {item.label}
        </a>
      );
    }

    return (
      <Link to={isHash ? `/${item.href}` : item.href} className={className}>
        {item.label}
      </Link>
    );
  };

  return (
    <footer className="relative border-t border-border overflow-hidden">
      <Container>
        {/* TOP */}

        <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr_1fr] gap-12 pt-16 md:pt-24 pb-14">
          <div>
            <p className="text-eyebrow mb-5">Next step</p>

            <p className="text-[30px] md:text-[44px] font-semibold leading-[1.02] tracking-[-0.05em] max-w-md text-balance">
              Have an idea worth building?{" "}
              <span className="text-accent text-secondary">Let&apos;s talk.</span>
            </p>

            {email && (
              <a href={`mailto:${email}`} className="btn btn-primary mt-8">
                {email}
                <ArrowUpRight size={15} aria-hidden="true" />
              </a>
            )}
          </div>

          <nav aria-label="Footer">
            <p className="text-eyebrow mb-5">Navigate</p>

            <ul className="grid grid-cols-2 gap-x-6 gap-y-3">
              {navbarContent.map((item) => (
                <li key={item.label}>{renderLink(item)}</li>
              ))}
            </ul>
          </nav>

          <div>
            <p className="text-eyebrow mb-5">Elsewhere</p>

            <ul className="flex flex-col gap-3">
              {socials.map((item) => (
                <li key={item.icon}>
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noreferrer"
                    className="group inline-flex items-center gap-1.5 text-small hover:text-primary transition-colors"
                  >
                    {SOCIAL_LABELS[item.icon] || item.icon}
                    <ArrowUpRight
                      size={13}
                      aria-hidden="true"
                      className="opacity-0 -translate-x-1 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0"
                    />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* SIGN-OFF — the name, set edge to edge */}

        <p
          aria-hidden="true"
          className="
            select-none

            text-center

            font-semibold

            leading-[0.8]

            tracking-[-0.07em]

            whitespace-nowrap

            text-[clamp(3rem,13.2vw,11.5rem)]

            bg-gradient-to-b
            from-primary
            to-primary/0

            bg-clip-text
            text-transparent

            pb-[0.08em]
          "
        >
          {footerName}
        </p>

        {/* BOTTOM BAR */}

        <div className="relative flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border py-6">
          <p className="text-muted text-center sm:text-left">
            © {year} {footerName} · {footerRole}
          </p>

          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="group inline-flex items-center gap-2 text-small hover:text-primary transition-colors"
          >
            Back to top
            <span className="h-8 w-8 rounded-full border border-border inline-flex items-center justify-center transition-colors group-hover:border-primary">
              <ArrowUp size={14} aria-hidden="true" />
            </span>
          </button>
        </div>
      </Container>
    </footer>
  );
}

export default Footer;
