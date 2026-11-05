/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { unoptimized: true },
  async headers() {
    return [{ source: "/i/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] },
            { source: "/espace/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }, { key: "Referrer-Policy", value: "no-referrer" }] }];
  },
};
export default nextConfig;
