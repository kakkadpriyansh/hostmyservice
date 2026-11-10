/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["ssh2", "node-ssh"],
  
  experimental: {
    // Set server actions body size limit to a very large value
    serverActions: {
      bodySizeLimit: '500mb',
    },
  },
};

export default nextConfig;
