import { betterAuth } from "better-auth/minimal";
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
  admin,
} from "better-auth/plugins";
import { schema } from "@/backend/db";
import { localization } from "better-auth-localization";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      ...schema,
    },
  }),
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24, // 1 day (every 1 day the session expiration is updated)
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
      version: "1",
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url, token }) => {
      log("Account", "info", "Password reset email " + token);
      await sendResetPasswordEmail(user.email, user.name, url);
    },
    resetPasswordTokenExpiresIn: 24 * 60 * 60,
    disableSignUp: true,
  },
  appName: "Moje konie",
  user: {
    changeEmail: {
      enabled: false,
    },
    deleteUser: {
      enabled: false,
    },
  },
  trustedOrigins: ["http://localhost:3000", "http://localhost:5173"],
  emailVerification: {
    sendVerificationEmail: async ({ user, url, token }) => {
      log("Account", "info", "Send verification email " + token);
      await sendAccountConfirmationEmail(user.email, user.name, url);
    },
    expiresIn: 24 * 60 * 60,
    autoSignInAfterVerification: true,
    sendOnSignUp: true,
  },
  plugins: [
    bearer(),
    organization({
      allowUserToCreateOrganization: (user) => {
        return user.role === "admin";
      },
    }),
    openAPI({
      disableDefaultReference: true,
    }),
    jwt(),
    apiKey(),
    admin({
      defaultRole: "user",
      adminRole: "admin",
    }),
    localization({
      defaultLocale: "pl-PL",
      fallbackLocale: "default", // Fallback to English
    }),
  ],
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
