import Wordmark from "../ui/Wordmark";

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
        <div className="mb-8 flex justify-center">
          <Wordmark />
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
