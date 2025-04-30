/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [{
                protocol: 'https',
                hostname: 'lh3.googleusercontent.com',
            },
            // 필요시 다른 도메인도 추가
        ],
    },
};

module.exports = nextConfig;