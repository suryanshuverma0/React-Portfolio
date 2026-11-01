import Container from "../../ui/Container";
import SectionTitle from "../../ui/SectionTitle";
import ResearchCard from "./ResearchCard";
import { researchContent } from "../../content/researchContent";

function Research() {
  return (
    <section id="research" className="section relative">
      {/* Dotted field behind the featured paper */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-1/3 -z-10 h-2/3 bg-dots mask-radial opacity-70"
      />

      <Container>
        <SectionTitle
          index="01"
          eyebrow="Featured research"
          title={
            <>
              Peer-reviewed research, backed by{" "}
              <span className="text-accent">working systems.</span>
            </>
          }
          description="Research on blockchain system design, backed by implementations that are deployed and measured — on a local network and a public testnet."
        />

        <div className="flex flex-col gap-10">
          {researchContent.map((paper, index) => (
            <ResearchCard key={paper.id} paper={paper} index={index} />
          ))}
        </div>
      </Container>
    </section>
  );
}

export default Research;
