/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
    NEXT_PUBLIC_DDNS_API_URL: process.env.NEXT_PUBLIC_DDNS_API_URL || 'http://3.72.176.165:3000',
  },
}

module.exports = nextConfig