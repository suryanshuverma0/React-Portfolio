import {
  Helmet,
} from "react-helmet-async";

function SEO({
  title,
  description,
  keywords,
  image,
}) {

  return (

    <Helmet>

      {/* TITLE */}

      <title>

        {title}

      </title>

      {/* META */}

      <meta
        name="description"
        content={description}
      />

      <meta
        name="keywords"
        content={keywords}
      />

      <meta
        name="author"
        content="Suryanshu Verma"
      />

      {/* OPEN GRAPH */}

      <meta
        property="og:title"
        content={title}
      />

      <meta
        property="og:description"
        content={description}
      />

      <meta
        property="og:image"
        content={image}
      />

      <meta
        property="og:type"
        content="website"
      />

      {/* TWITTER */}

      <meta
        name="twitter:card"
        content="summary_large_image"
      />

      <meta
        name="twitter:title"
        content={title}
      />

      <meta
        name="twitter:description"
        content={description}
      />

      <meta
        name="twitter:image"
        content={image}
      />

    </Helmet>

  );
}

export default SEO;
