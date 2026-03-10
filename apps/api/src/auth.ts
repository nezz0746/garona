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
  advanced: {
    database: {
      generateId: "uuid",
    },
  },
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
  user: {
    additionalFields: {
      username: {
        type: "string",
        required: false,
        input: true,
      },
      avatarUrl: {
        type: "string",
        required: false,
        fieldName: "avatar_url",
        input: true,
      },
      bio: {
        type: "string",
        required: false,
        input: true,
      },
    },
  },
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    passkey({
      rpID: process.env.PASSKEY_RP_ID || "localhost",
      rpName: "Garona",
      origin: process.env.PASSKEY_ORIGIN
        ? process.env.PASSKEY_ORIGIN.split(",")
        : ["http://localhost:8081", "http://localhost:19006"],
    }),
  ],
  trustedOrigins: [
    "http://localhost:8081",
    "http://localhost:19006",
    "http://localhost:3001",
    "http://192.168.1.58:3001",
    "https://garona.econome.studio",
    "https://api.garona.econome.studio",
    "garona://",
  ],
});
