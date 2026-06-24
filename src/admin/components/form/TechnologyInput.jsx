import { useState } from "react";
import { X } from "lucide-react";

function TechnologyInput({
  technologies,
  setTechnologies,
}) {
  const [value, setValue] =
    useState("");

  const addTechnology = () => {
    const tech = value.trim();

    if (!tech) return;

    if (
      technologies.includes(tech)
    )
      return;

    setTechnologies([
      ...technologies,
      tech,
    ]);

    setValue("");
  };

  const removeTechnology = (
    tech,
  ) => {
    setTechnologies(
      technologies.filter(
        (item) => item !== tech,
      ),
    );
  };

  return (
    <div className="space-y-4">
      <label className="text-label">
        Technologies
      </label>

      <div className="flex gap-2">
        <input
          value={value}
          onChange={(e) =>
            setValue(
              e.target.value,
            )
          }
          placeholder="React"
          className="
            flex-1

            h-control

            px-control

            rounded-control

            bg-surface

            border
            border-border
          "
        />

        <button
          type="button"
          onClick={addTechnology}
          className="
            px-5

            rounded-control

            bg-primary

            text-background
          "
        >
          Add
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {technologies.map(
          (tech) => (
            <div
              key={tech}
              className="
                flex
                items-center

                gap-2

                px-4
                py-2

                rounded-full

                bg-surface

                border
                border-border
              "
            >
              <span>{tech}</span>

              <button
                type="button"
                onClick={() =>
                  removeTechnology(
                    tech,
                  )
                }
              >
                <X size={14} />
              </button>
            </div>
          ),
        )}
      </div>
    </div>
  );
}

export default TechnologyInput;