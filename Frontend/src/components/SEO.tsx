import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title: string;
  description?: string;
}

const SEO: React.FC<SEOProps> = ({ title, description }) => {
  return (
    <Helmet>
      <title>{title} | AgriFlux - AI Agriculture Intelligence</title>
      {description && <meta name="description" content={description} />}
    </Helmet>
  );
};

export default SEO;
