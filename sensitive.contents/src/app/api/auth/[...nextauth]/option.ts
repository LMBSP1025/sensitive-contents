import { AuthOptions } from "next-auth";
import FacebookProvider from "next-auth/providers/facebook";

export const authOptions: AuthOptions = {
  providers: [
    FacebookProvider({
      clientId: process.env.NEXT_PUBLIC_FACEBOOK_CLIENT_ID || "",
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET || "",
      authorization: {
        params: {
          scope: "public_profile,email"
        }
      }
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account?.access_token) {
        token.accessToken = account.access_token;
      }
      return token;
    },
    async session({ session, token }) {
      return {
        ...session,
        accessToken: token.accessToken as string
      };
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
