function NavItem({ item, mobile = false, active = false, onClick }) {
  return (
    <a
      href={item.href}
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
    </a>
  );
}

export default NavItem;
