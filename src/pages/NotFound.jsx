import {
  Link,
} from "react-router-dom";

import {
  ArrowLeft,
} from "lucide-react";

function NotFound() {

  return (

    <main
      className="
        min-h-screen

        flex
        items-center
        justify-center

        px-6
      "
    >

      <div
        className="
          text-center

          max-w-xl
        "
      >

        {/* 404 */}

        <p
          className="
            text-[120px]
            md:text-[160px]

            font-semibold

            tracking-[-0.08em]

            leading-none

            mb-6
          "
        >

          404

        </p>

        {/* TITLE */}

        <h1
          className="
            text-heading

            mb-4
          "
        >

          Page not found

        </h1>

        {/* DESCRIPTION */}

        <p
          className="
            text-large

            mb-8
          "
        >

          The page you are looking for
          does not exist or may have
          been moved.

        </p>

        {/* BUTTON */}

        <Link

          to="/"

          className="
            h-control

            px-control

            rounded-control

            bg-primary

            text-background

            inline-flex
            items-center
            justify-center

            gap-2

            text-label

            transition-all
            duration-300

            hover:opacity-90
          "
        >

          <ArrowLeft
            size={16}
          />

          Back to Home

        </Link>

      </div>

    </main>

  );
}

export default NotFound;
