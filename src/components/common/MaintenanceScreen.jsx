function MaintenanceScreen() {
  return (
    <main
      className="
        min-h-screen

        bg-background

        flex
        items-center
        justify-center

        px-4
        py-8
      "
    >
      <div
        className="
          glass

          w-full
          max-w-[420px]

          rounded-[32px]

          p-8

          text-center
        "
      >
        <div
          className="
            mx-auto
            mb-6

            h-11
            w-11

            rounded-2xl

            bg-primary

            text-background

            flex
            items-center
            justify-center

            text-sm
            font-semibold

            tracking-tight
          "
        >
          SV
        </div>

        <h1
          className="
            text-[24px]
            font-semibold
            tracking-[-0.03em]
          "
        >
          Under Maintenance
        </h1>

        <p
          className="
            mt-3

            text-small
          "
        >
          This site is temporarily undergoing maintenance. Please check back
          shortly.
        </p>
      </div>
    </main>
  );
}

export default MaintenanceScreen;
