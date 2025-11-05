import { generateEmailTemplate } from "./emailTemplate";
import { ProcessEnv } from "../env";
import { log } from "../logs/logger";
import { transporter } from "./mailer";

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
