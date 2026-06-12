function SkeletonCard() {

  return (

    <div
      className="
        card

        animate-pulse
      "
    >

      {/* IMAGE */}

      <div
        className="
          aspect-16/10

          rounded-2xl

          bg-surface

          mb-5
        "
      />

      {/* TITLE */}

      <div
        className="
          h-6
          w-2/3

          rounded-full

          bg-surface

          mb-4
        "
      />

      {/* DESCRIPTION */}

      <div
        className="
          flex
          flex-col

          gap-3

          mb-6
        "
      >

        <div
          className="
            h-4

            rounded-full

            bg-surface
          "
        />

        <div
          className="
            h-4
            w-5/6

            rounded-full

            bg-surface
          "
        />

      </div>

      {/* TAGS */}

      <div
        className="
          flex

          gap-3
        "
      >

        <div
          className="
            h-9
            w-20

            rounded-2xl

            bg-surface
          "
        />

        <div
          className="
            h-9
            w-24

            rounded-2xl

            bg-surface
          "
        />

      </div>

    </div>

  );
}

export default SkeletonCard;
