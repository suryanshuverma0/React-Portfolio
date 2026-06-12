import SkeletonCard
from "../../common/SkeletonCard";

function ProjectsFallback() {

  return (

    <div
      className="
        grid

        grid-cols-1
        lg:grid-cols-2

        gap-5
      "
    >

      {Array.from({
        length: 4,
      }).map(
        (
          _,
          index
        ) => (

          <SkeletonCard
            key={index}
          />

        )
      )}

    </div>

  );
}

export default ProjectsFallback;