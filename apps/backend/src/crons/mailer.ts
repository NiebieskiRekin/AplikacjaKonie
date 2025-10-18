import nodemailer from "nodemailer";
import { ProcessEnv } from "../env";
import { generateEmailTemplate } from "./emailTemplate";
import { log } from "../logs/logger";

export const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  service: "gmail",
  auth: {
    user: ProcessEnv.EMAIL_USER,
    pass: ProcessEnv.EMAIL_PASS,
  },
});

/**
 * Wysyła wiadomości e-mail do użytkowników
 */
export async function sendEmailNotifications(
  userNotifications: Record<
    string,
    {
      wydarzenia: Record<
        string,
        { nazwaKonia: string; rodzajKonia: string; dataWaznosci: string }[]
      >;
    }
  >
) {
  for (const email in userNotifications) {
    try {
      const { wydarzenia } = userNotifications[email];

      const emailContent = generateEmailTemplate(wydarzenia);

      const mailOptions = {
        from: ProcessEnv.EMAIL_USER,
        to: email,
        subject: "⏳ Przypomnienie o wydarzeniach dla Twoich koni",
        html: emailContent,
      };

      await transporter.sendMail(mailOptions);
      log("Email", "info", `Wysłano e-mail do: ${email}`);
    } catch (error) {
      log(
        "Email",
        "debug",
        `Błąd wysyłania e-maila do ${email}:`,
        error as Error
      );
    }
  }
}
