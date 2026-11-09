import Container from "../../ui/Container";
import SectionTitle from "../../ui/SectionTitle";
import ResearchCard from "./ResearchCard";
import { useResearch } from "../../../hooks/useResearch";

function Research() {
  // Papers from admin → Research (falls back to the built-in paper).
  const papers = useResearch();

  return (
    <section id="research" className="section relative">
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
          {papers.map((paper, index) => (
            <ResearchCard key={paper.id} paper={paper} index={index} />
          ))}
        </div>
      </Container>
    </section>
  );
}

export default Research;
