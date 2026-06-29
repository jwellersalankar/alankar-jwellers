import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import dbconnect from "@/src/lib/dbconnect";
import UserModel from "@/src/models/User";
import { email } from "zod";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials: any): Promise<any> {
        await dbconnect();

        try {
          const user = await UserModel.findOne({
            email: credentials.identifier,
          });

          if (!user) {
            throw new Error("No user found with the provided email.");
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password.toString(),
          );

          if (!isPasswordValid) {
            throw new Error("Invalid password.");
          }

          // ✅ return clean object
          return {
            _id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
            verified: user.verified,
          };
        } catch (error: any) {
          throw new Error(error.message);
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token._id = user._id;
        token.role = user.role;
        token.verified = user.verified;
      }

      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user._id = token._id;
        session.user.name = token.name;
        session.user.email = token.email;
        session.user.role = token.role;
        session.user.verified = token.verified;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXT_AUTH_SECRET,
  pages: {
    signIn: "/sign-in",
  },
};
