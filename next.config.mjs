/** @type {import('next').NextConfig} */
const isGitHubPages = process.env.GITHUB_PAGES === 'true';
const isStaticExport = isGitHubPages || process.env.STATIC_EXPORT === 'true';
const basePath = isGitHubPages ? '/warMap' : '';

const nextConfig = {
  reactStrictMode: true,
  agentRules: false,
  output: isStaticExport ? 'export' : undefined,
  trailingSlash: isStaticExport,
  basePath,
  assetPrefix: basePath || undefined,
};

export default nextConfig;
