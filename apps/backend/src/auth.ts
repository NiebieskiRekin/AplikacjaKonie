import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/backend/db";
import { log } from "./logs/logger";
import {
  sendAccountConfirmationEmail,
  sendResetPasswordEmail,
} from "./mailer/accountMailer";
import {
  bearer,
  jwt,
  openAPI,
  organization,
  apiKey,
} from "better-auth/plugins";
import { ProcessEnv } from "./env";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url, token }) => {
      log("Account", "info", "Password reset email " + token);
      await sendResetPasswordEmail(user.email, user.name, url);
    },
    resetPasswordTokenExpiresIn: 24 * 60 * 60,
  },
  trustedOrigins: ProcessEnv.TRUSTED_ORIGINS,
  emailVerification: {
    sendVerificationEmail: async ({ user, url, token }) => {
      log("Account", "info", "Send verification email " + token);
      await sendAccountConfirmationEmail(user.email, user.name, url);
    },
    expiresIn: 24 * 60 * 60,
    autoSignInAfterVerification: true,
    sendOnSignUp: true,
  },
  plugins: [bearer(), organization(), openAPI(), jwt(), apiKey()],
  advanced: {
    defaultCookieAttributes: {
      sameSite: "none",
      secure: true,
      partitioned: true,
    },
  },
});

export type auth_vars = {
  Variables: {
    user: typeof auth.$Infer.Session.user | null;
    session: typeof auth.$Infer.Session.session | null;
  };
};
