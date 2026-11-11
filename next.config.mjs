/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["ssh2", "node-ssh"],
  
  experimental: {
    // Server Actions buffer the whole request in memory. Keep this just above
    // MAX_UPLOAD_BYTES (500MB, lib/validations.ts) and well below PM2's
    // max_memory_restart (ecosystem.config.cjs).
    serverActions: {
      bodySizeLimit: '510mb',
    },
  },
};

export default nextConfig;
