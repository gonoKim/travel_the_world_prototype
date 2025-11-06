/** @type {import('next').NextConfig} */
const isProjectPage = true; 
const repoName = "travel_the_world_prototype";

/** @type {import('next').NextConfig} */
const config = {
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
  ...(isProjectPage && {
    basePath: `/${repoName}`,
    assetPrefix: `/${repoName}/`,
  }),
};

module.exports = config;
