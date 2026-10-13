import Container from "../../ui/Container";
import SectionTitle from "../../ui/SectionTitle";
import ResearchCard from "./ResearchCard";
import { researchContent } from "../../content/researchContent";

function Research() {
  return (
    <section id="research" className="section">
      <Container>
        <SectionTitle
          eyebrow="Research"
          title="Research and publications."
          description="Research on blockchain system design, backed by implementations that are deployed and measured."
        />

        <div className="flex flex-col gap-8">
          {researchContent.map((paper, index) => (
            <ResearchCard key={paper.id} paper={paper} index={index} />
          ))}
        </div>
      </Container>
    </section>
  );
}

export default Research;
