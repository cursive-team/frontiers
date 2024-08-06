import NextAuth from "next-auth";
import GithubProvider from "next-auth/providers/github";
import type { NextAuthOptions } from "next-auth";

export const authOptions: NextAuthOptions = {
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async jwt({ token, account, user, profile }) {
      if (account?.provider === "github") {
        token.accessToken = account.access_token;
        token.githubLogin = (profile as any).login;
      }
      return token;
    },
    async session({ session, token }) {
      (session as any).accessToken = token.accessToken;
      (session as any).githubUserId = token.sub;
      (session as any).githubLogin = token.githubLogin;
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET!,
};

export default NextAuth(authOptions);
