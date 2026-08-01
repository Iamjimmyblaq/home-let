import { Helmet } from 'react-helmet-async';

export const SITE_URL = 'https://home-let.lovable.app';
export const SITE_NAME = 'Home-let';

type SeoProps = {
  title: string;
  description: string;
  /** Route path, e.g. "/listings". Used for canonical + og:url. */
  path: string;
  image?: string;
  type?: 'website' | 'article' | 'product';
  noindex?: boolean;
  /** Optional JSON-LD object(s) for this route. */
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
};

export const Seo = ({ title, description, path, image, type = 'website', noindex, jsonLd }: SeoProps) => {
  const url = `${SITE_URL}${path}`;
  const schemas = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];

  return (
    <Helmet prioritizeSeoTags>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      {image && <meta property="og:image" content={image} />}

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {image && <meta name="twitter:image" content={image} />}

      {schemas.map((schema, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      ))}
    </Helmet>
  );
};
