/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // بيطلّع نسخة "standalone" فيها السيرفر + بس اللي محتاجينه من node_modules،
  // فصورة الـ Docker تطلع صغيرة. Vercel بيتجاهل السطر ده وبيستخدم بناءه بتاعه،
  // فمابيأثرش على النشر المجاني خالص.
  output: 'standalone',
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co', pathname: '/storage/v1/object/public/**' },
    ],
  },
};

export default nextConfig;
