/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack(config) {
    const fileLoaderRule = config.module.rules.find((rule) => rule?.test?.test?.(".svg"));
    const existingNot = Array.isArray(fileLoaderRule?.resourceQuery?.not) ? fileLoaderRule.resourceQuery.not : [];

    config.module.rules.push(
      {
        ...fileLoaderRule,
        test: /\.svg$/i,
        resourceQuery: /url/
      },
      {
        test: /\.svg$/i,
        issuer: fileLoaderRule?.issuer,
        resourceQuery: { not: [...existingNot, /url/] },
        use: ["@svgr/webpack"]
      }
    );

    if (fileLoaderRule) {
      fileLoaderRule.exclude = /\.svg$/i;
    }

    return config;
  }
};

export default nextConfig;
