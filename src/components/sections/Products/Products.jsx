import Container from "../../ui/Container";
import SectionTitle from "../../ui/SectionTitle";
import ProductCard from "./ProductCard";
import { useProducts } from "../../../hooks/useProducts";

/* ========================================
   PRODUCTS — live things you've shipped
   (sites, SaaS, apps), managed in admin →
   Products. Hidden entirely until there is
   at least one.
========================================= */

function Products() {
  const products = useProducts();

  if (!products.length) return null;

  return (
    <section id="products" className="section">
      <Container>
        <SectionTitle
          index="05"
          eyebrow="Products"
          title={
            <>
              Things I&apos;ve shipped — <span className="text-accent">live and in use.</span>
            </>
          }
          description="Real products running in production: open them, try them, use them."
        />

        <div className={`grid gap-6 ${products.length > 1 ? "md:grid-cols-2" : "mx-auto max-w-3xl"}`}>
          {products.map((product, index) => (
            <ProductCard key={product._id} product={product} index={index} />
          ))}
        </div>
      </Container>
    </section>
  );
}

export default Products;
