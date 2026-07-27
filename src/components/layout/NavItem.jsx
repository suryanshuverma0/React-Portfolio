import { Link, useLocation } from "react-router-dom";

function NavItem({ item, mobile = false, active = false, onClick }) {
  const location = useLocation();

  const isHash = item.href.startsWith("#");
  const onHomePage = location.pathname === "/";

  // On the homepage, hash items are plain in-page anchors. Anywhere else
  // (e.g. /blog), they need to route back to "/" first — ScrollToHash
  // then handles scrolling to the section once we land there.
  const isRoute = !isHash || !onHomePage;

  const LinkComponent = isRoute ? Link : "a";
  const linkProp = isRoute
    ? { to: isHash ? `/${item.href}` : item.href }
    : { href: item.href };

  return (
    <LinkComponent
      {...linkProp}
      onClick={onClick}
      className={`
        relative

        ${
          mobile
            ? `
              h-11
              px-4

              flex
              items-center
            `
            : `
              h-10
              px-4

              inline-flex
              items-center
              justify-center
            `
        }

        rounded-xl

        text-sm
        font-medium

        tracking-tight

        transition-all
        duration-200

        ${
          active
            ? `
              text-primary

              bg-black/5
              dark:bg-white/8
            `
            : `
              text-secondary

              hover:text-primary

              hover:bg-black/[0.03]
              dark:hover:bg-white/[0.04]
            `
        }
      `}
    >
      {mobile ? item.mobileLabel : item.label}

      {!mobile && active && (
        <span
          className="
            absolute

            bottom-1.5
            left-1/2

            -translate-x-1/2

            h-1
            w-1

            rounded-full

            bg-primary
          "
        />
      )}
    </LinkComponent>
  );
}

export default NavItem;
