import { Link, useLocation } from "react-router-dom";

import { motion } from "framer-motion";

function NavItem({ item, mobile = false, active = false, onClick, index = 0 }) {
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

  if (mobile) {
    return (
      <LinkComponent
        {...linkProp}
        onClick={onClick}
        aria-current={active ? "true" : undefined}
        className={`
          group

          flex
          items-center
          justify-between

          py-3.5

          border-b
          border-border

          text-[22px]
          font-semibold

          tracking-[-0.03em]

          transition-colors

          ${active ? "text-primary" : "text-secondary hover:text-primary"}
        `}
      >
        {item.mobileLabel}

        <span className="text-eyebrow">{String(index + 1).padStart(2, "0")}</span>
      </LinkComponent>
    );
  }

  return (
    <LinkComponent
      {...linkProp}
      onClick={onClick}
      aria-current={active ? "true" : undefined}
      className={`
        relative
        isolate

        h-9
        px-3
        xl:px-3.5

        inline-flex
        items-center
        justify-center

        rounded-full

        text-[13.5px]
        font-medium

        tracking-tight

        transition-colors
        duration-200

        ${active ? "text-background" : "text-secondary hover:text-primary"}
      `}
    >
      {/* Shared pill that slides between the active items */}
      {active && (
        <motion.span
          layoutId="nav-active"
          transition={{ type: "spring", stiffness: 420, damping: 36 }}
          className="absolute inset-0 -z-10 rounded-full bg-primary"
        />
      )}

      {item.label}
    </LinkComponent>
  );
}

export default NavItem;
