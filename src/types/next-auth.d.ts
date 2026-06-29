// types/next-auth.d.ts

import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    role: string;
    _id: string;
    verified: boolean;
  }

  interface Session {
    user: {
      _id: string;
      role: string;
      verified: boolean;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    _id: string;
    role: string;
    verified: boolean;
  }
}