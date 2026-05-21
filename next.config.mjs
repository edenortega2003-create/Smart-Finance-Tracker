/** @type {import('next').NextConfig} */
import withPWA from '@ducanh2912/next-pwa';

const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
};

export default withPWA({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  workboxOptions: { disableDevLogs: true },
})(nextConfig);