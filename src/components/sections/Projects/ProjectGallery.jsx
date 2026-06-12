import {
  useState,
} from "react";

function ProjectGallery({
  images,
  title,
}) {

  const [
    selectedImage,
    setSelectedImage,
  ] = useState(
    images?.[0]
  );

  return (

    <div
      className="
        flex
        flex-col

        gap-4
      "
    >

      {/* MAIN IMAGE */}

      <div
        className="
          overflow-hidden

          rounded-3xl

          border
          border-border

          bg-surface
        "
      >

        <img
          src={selectedImage}

          alt={title}

          className="
            w-full

            aspect-[16/9]

            object-cover
          "
        />

      </div>

      {/* THUMBNAILS */}

      <div
        className="
          grid

          grid-cols-3
          sm:grid-cols-4
          md:grid-cols-5

          gap-3
        "
      >

        {images.map(
          (
            image,
            index
          ) => (

            <button

              key={index}

              type="button"

              onClick={() =>
                setSelectedImage(
                  image
                )
              }

              className={`
                overflow-hidden

                rounded-2xl

                border

                transition-all
                duration-300

                ${
                  selectedImage === image
                    ? `
                      border-primary
                    `
                    : `
                      border-border
                    `
                }
              `}
            >

              <img
                src={image}

                alt={`${title}-${index}`}

                className="
                  w-full

                  aspect-video

                  object-cover
                "
              />

            </button>

          )
        )}

      </div>

    </div>

  );
}

export default ProjectGallery;
