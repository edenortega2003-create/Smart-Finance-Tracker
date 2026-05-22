/** @type {import('next').NextConfig} */
import withPWA from '@ducanh2912/next-pwa';

const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  // Prevent @supabase/ssr (browser-only) from being bundled into the server prerender
  serverExternalPackages: ['@supabase/ssr', '@supabase/supabase-js'],
};

export default withPWA({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  workboxOptions: { disableDevLogs: true },
})(nextConfig);