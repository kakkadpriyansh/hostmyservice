/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["ssh2", "node-ssh"],
  turbopack: {},
};

export default nextConfig;
