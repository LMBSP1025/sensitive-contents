import NextAuth from "next-auth/next";
import { Session, Account, AuthOptions } from "next-auth";
import InstagramProvider from "next-auth/providers/instagram";
import { JWT } from "next-auth/jwt";

// 비즈니스 앱용 설정
export const authOptions: AuthOptions = {
  providers: [
    InstagramProvider({
      clientId: process.env.INSTAGRAM_CLIENT_ID || "",
      clientSecret: process.env.INSTAGRAM_CLIENT_SECRET || "",
    }),
  ],
  callbacks: {
    async jwt({ token, account }: { token: JWT; account: Account | null }) {
      // 인증 정보에서 accessToken을 JWT에 저장
      if (account?.access_token) {
        token.accessToken = account.access_token;
      }
      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      // 타입 단언 추가
      session.accessToken = token.accessToken as string;
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  useSecureCookies: process.env.NODE_ENV === 'production', // 프로덕션에서만 true
  debug: process.env.NODE_ENV === 'development', // 개발 환경에서 디버그 활성화
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };