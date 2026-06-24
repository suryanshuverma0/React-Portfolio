import { ImagePlus, Trash2 } from "lucide-react";

function ImageUploader({
  image,
  preview,
  onSelect,
  onRemove,
  label = "Image",
}) {
  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-label">
          {label}
        </h3>
      </div>

      <div
        className="
          flex
          justify-center
        "
      >
        <div
          className="
            h-36
            w-36

            overflow-hidden

            rounded-full

            bg-surface

            border
            border-border
          "
        >
          {preview ? (
            <img
              src={preview}
              alt="Preview"
              className="
                h-full
                w-full

                object-cover
              "
            />
          ) : (
            <div
              className="
                h-full
                w-full

                flex
                items-center
                justify-center
              "
            >
              <ImagePlus
                size={36}
                className="text-muted"
              />
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <label
          className="
            w-full

            h-control

            rounded-control

            bg-primary

            text-background

            flex
            items-center
            justify-center
            gap-2

            cursor-pointer

            text-label

            transition
            hover:opacity-90
          "
        >
          <ImagePlus size={18} />

          Upload Image

          <input
            type="file"
            accept="image/*"
            onChange={onSelect}
            hidden
          />
        </label>

        {(preview || image) && (
          <button
            type="button"
            onClick={onRemove}
            className="
              w-full

              h-control

              rounded-control

              bg-surface

              border
              border-border

              flex
              items-center
              justify-center
              gap-2

              text-label

              transition
              hover:opacity-80
            "
          >
            <Trash2 size={18} />

            Remove Image
          </button>
        )}
      </div>
    </div>
  );
}

export default ImageUploader;