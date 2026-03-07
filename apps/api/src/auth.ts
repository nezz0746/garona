import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { passkey } from "@better-auth/passkey";
import {
  db,
  users,
  sessions,
  accounts,
  passkeys,
  verifications,
} from "@garona/db";

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3001",
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: users,
      session: sessions,
      account: accounts,
      passkey: passkeys,
      verification: verifications,
    },
  }),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    passkey({
      rpID: process.env.PASSKEY_RP_ID || "localhost",
      rpName: "Garona",
      origin: process.env.PASSKEY_ORIGIN || "http://localhost:8081",
    }),
  ],
  trustedOrigins: [
    "http://localhost:8081",
    "http://localhost:19006",
    "http://localhost:3001",
    "http://192.168.1.58:3001",
    "https://garona.econome.studio",
    "garona://",
  ],
});
