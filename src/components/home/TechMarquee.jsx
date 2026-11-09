import { useResearch } from "../../hooks/useResearch";
import { servicesContent } from "../content/servicesContent";

function TechMarquee() {
  // The stack named across the research and services — deduplicated, in order.
  const papers = useResearch();
  const STACK = [
    ...new Set([
      ...papers.flatMap((paper) => paper.technologies || []),
      ...servicesContent.flatMap((service) => service.technologies),
    ]),
  ];

  // Rendered twice so the -50% translate loops without a visible seam.
  const track = [...STACK, ...STACK];

  return (
    <div
      aria-label="Technologies"
      className="
        relative

        border-y
        border-border

        py-5

        overflow-hidden

        mask-fade-x
      "
    >
      <ul className="flex w-max animate-marquee hover:[animation-play-state:paused]">
        {track.map((tech, index) => (
          <li
            key={`${tech}-${index}`}
            aria-hidden={index >= STACK.length}
            className="
              flex
              items-center

              shrink-0

              pr-10

              text-[15px]
              md:text-base

              font-medium

              tracking-tight

              text-muted

              transition-colors
              duration-300

              hover:text-primary
            "
          >
            <span aria-hidden="true" className="mr-10 text-[10px] text-border-strong">
              ◆
            </span>
            {tech}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default TechMarquee;
