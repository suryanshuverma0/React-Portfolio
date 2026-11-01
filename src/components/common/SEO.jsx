import PropTypes from "prop-types";

import { Helmet } from "react-helmet-async";

import { useLocation } from "react-router-dom";

import {
  SITE_NAME,
  SITE_URL,
  TWITTER_HANDLE,
  absoluteUrl,
} from "../../lib/site";

/*
  Per-page head tags. The canonical URL is derived from the current path
  (query strings dropped) so every route self-canonicalises on the www
  origin. index.html ships static fallbacks for crawlers that don't run
  JavaScript; main.jsx removes those before this component takes over, so
  rendered pages never carry two competing sets.
*/
function SEO({
  title,
  description,
  keywords,
  image,
  type = "website",
  noindex = false,
  jsonLd,
}) {
  const { pathname } = useLocation();

  const canonical = `${SITE_URL}${pathname === "/" ? "/" : pathname.replace(/\/+$/, "")}`;

  const imageUrl = absoluteUrl(image);

  return (
    <Helmet>
      <title>{title}</title>

      <link rel="canonical" href={canonical} />

      <meta name="description" content={description} />

      {keywords && <meta name="keywords" content={keywords} />}

      <meta name="author" content={SITE_NAME} />

      <meta
        name="robots"
        content={
          noindex
            ? "noindex, nofollow"
            : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"
        }
      />

      {/* OPEN GRAPH */}

      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="en_US" />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonical} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:image:alt" content={title} />

      {/* TWITTER / X */}

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content={TWITTER_HANDLE} />
      <meta name="twitter:creator" content={TWITTER_HANDLE} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />

      {jsonLd && (
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      )}
    </Helmet>
  );
}

SEO.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  keywords: PropTypes.string,
  image: PropTypes.string,
  type: PropTypes.string,
  noindex: PropTypes.bool,
  jsonLd: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
};

export default SEO;
