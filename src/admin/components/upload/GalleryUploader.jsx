import { ImagePlus, X } from "lucide-react";

function GalleryUploader({
  images,
  onAdd,
  onRemove,
  label = "Gallery",
  uploading = false,
}) {
  return (
    <div className="space-y-4">
      <label className="text-label">{label}</label>

      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
        {images.map((image, index) => (
          <div
            key={image.publicId || index}
            className="
              relative

              aspect-video

              overflow-hidden

              rounded-2xl

              border
              border-border

              bg-surface
            "
          >
            <img
              src={image.url}
              alt=""
              className="h-full w-full object-cover"
            />

            <button
              type="button"
              onClick={() => onRemove(index)}
              className="
                absolute
                top-1.5
                right-1.5

                h-6
                w-6

                rounded-full

                bg-black/60

                text-white

                flex
                items-center
                justify-center
              "
            >
              <X size={12} />
            </button>
          </div>
        ))}

        <label
          className="
            aspect-video

            rounded-2xl

            border
            border-dashed
            border-border

            bg-surface

            flex
            flex-col
            items-center
            justify-center
            gap-1

            cursor-pointer

            text-small

            transition

            hover:border-primary
          "
        >
          <ImagePlus size={18} />

          {uploading ? "Uploading..." : "Add"}

          <input
            type="file"
            accept="image/*"
            multiple
            hidden
            disabled={uploading}
            onChange={onAdd}
          />
        </label>
      </div>
    </div>
  );
}

export default GalleryUploader;
