/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [{
                protocol: 'https',
                hostname: 'lh3.googleusercontent.com',
            },
            // 필요시 다른 도메인도 추가
        ],
        domains: ['lh3.googleusercontent.com'], // Google 프로필 이미지 도메인 추가
    },
    async headers() {
        return [{
            source: '/api/:path*',
            headers: [
                { key: 'Access-Control-Allow-Credentials', value: 'true' },
                { key: 'Access-Control-Allow-Origin', value: process.env.NEXT_PUBLIC_APP_URL || '*' },
                { key: 'Access-Control-Allow-Methods', value: 'GET,POST,DELETE,PATCH,OPTIONS' },
                { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization' },
            ],
        }];
    },
};

module.exports = nextConfig;