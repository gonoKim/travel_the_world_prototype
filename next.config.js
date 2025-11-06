// next.config.js (prod-only basePath)
/** @type {import('next').NextConfig} */
const repoName = "travel_the_world_prototype"; // ← your repo name
const isProd = process.env.NODE_ENV === "production";

/** @type {import('next').NextConfig} */
const config = {
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
  ...(isProd && {
    basePath: `/${repoName}`,
    assetPrefix: `/${repoName}/`,
  }),
};

module.exports = config;
