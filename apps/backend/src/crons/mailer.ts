import nodemailer from "nodemailer";
import { ProcessEnv } from "../env";

// Coś takiego byśmy zrobili czy jakiś zwykły gmail narazie?
export const transporter = nodemailer.createTransport({
  host: "mail.moje-konie.at2k.pl",
  port: 465, // 587 ?
  secure: true, // false
  auth: {
    user: ProcessEnv.EMAIL_USER, 
    pass: ProcessEnv.EMAIL_PASS,
  },
});

/**
 * Wysyła wiadomości e-mail do użytkowników
 */
export async function sendEmailNotifications(userNotifications: Record<string, { rodzajKonia: string; wydarzenia: Record<string, string[]> }>) {
  for (const email in userNotifications) {
    const { wydarzenia, rodzajKonia } = userNotifications[email];

    let messageBody = `Hej! Oto nadchodzące wydarzenia dla Twoich koni:\n\n`;

    for (const rodzajZdarzenia in wydarzenia) {
      const konie = wydarzenia[rodzajZdarzenia];

      if (konie.length > 1 && konie.every(k => k === konie[0])) {
        messageBody += `📌 Wszystkie konie ${rodzajKonia} - ${rodzajZdarzenia}\n`;
      } else {
        messageBody += `📌 ${rodzajZdarzenia} dla: ${konie.join(", ")}\n`;
      }
    }

    const mailOptions = {
      from: ProcessEnv.EMAIL_USER,
      to: email,
      subject: `⏳ Przypomnienie o wydarzeniach dla Twoich koni`,
      text: messageBody,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Wysłano ${email}`);
  }
}
