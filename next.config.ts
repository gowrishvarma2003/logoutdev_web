import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/notes", destination: "/productivity/notes", permanent: false },
      { source: "/notes/:noteId", destination: "/productivity/notes/:noteId", permanent: false },
    ];
  },
};

export default nextConfig;
