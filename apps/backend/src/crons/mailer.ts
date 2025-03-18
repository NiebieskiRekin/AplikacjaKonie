import nodemailer from "nodemailer";
import { ProcessEnv } from "../env";

export const transporter = nodemailer.createTransport({
  host: "stmp.gmail.com",
  port: 587,
  secure: false, // do pomyślenia czy chcemy to zmienić na secure, nw czy nie wystaczy po prostu zmienić portu i dać true szczerze mówiąc
  service: "gmail",
  auth: {
    user: ProcessEnv.EMAIL_USER,
    pass: ProcessEnv.EMAIL_PASS
  },
});

/**
 * Wysyła wiadomości e-mail do użytkowników
 */
export async function sendEmailNotifications(
  userNotifications: Record<
    string,
    {
      wydarzenia: Record<string, { nazwaKonia: string; rodzajKonia: string; dataWaznosci: string }[]>;
    }
  >
) {
  for (const email in userNotifications) {
    const { wydarzenia } = userNotifications[email];

    let messageBody = `
      <div style="font-family: Arial, sans-serif; line-height: 1.8; color: #333; padding: 20px;">
        <p style="font-size: 18px;">Hej! Oto kończące się wydarzenia w Twojej stajni:</p>
    `;

    for (const rodzajZdarzenia in wydarzenia) {
      const konie = wydarzenia[rodzajZdarzenia];

      if (!konie || konie.length === 0) continue;

      // Grupowanie wg `rodzajKonia`
      const groupedHorses: Record<string, { nazwaKonia: string; dataWaznosci: string }[]> = {};

      konie.forEach(({ nazwaKonia, rodzajKonia, dataWaznosci }) => {
        if (!groupedHorses[rodzajKonia]) {
          groupedHorses[rodzajKonia] = [];
        }
        groupedHorses[rodzajKonia].push({ nazwaKonia, dataWaznosci });
      });

      messageBody += `<h2 style="color: #d9534f; padding-left: 20px; font-size: 16px">📌 ${rodzajZdarzenia}</h2>`;

      for (const [rodzaj, horses] of Object.entries(groupedHorses)) {
        messageBody += `<h3 style="color: #5a5a5a; padding-left: 40px; font-size: 14px">🐴 ${rodzaj}</h3>`;
        messageBody += `<div style="background: #f8f8f8; padding: 10px; border-radius: 5px; margin-left: 60px;">`;

        horses.forEach(({ nazwaKonia, dataWaznosci }) => {
          messageBody += `<p style="margin: 5px 0; font-size: 18px; padding-left: 20px; font-size: 12px"><strong>${nazwaKonia}</strong> - <span style="color: #ff4500;"> ${dataWaznosci}</span></p>`;
        });

        messageBody += `</div>`;
      }
    }

    messageBody += `
            <p style="margin-top: 20px; color: #555; font-size: 14px;">Dziękujemy za korzystanie z naszej aplikacji!</p>
          </div>
          `;

    const mailOptions = {
      from: ProcessEnv.EMAIL_USER,
      to: email,
      subject: `⏳ Przypomnienie o wydarzeniach dla Twoich koni`,
      html: messageBody,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Wysłano ${email}`);
  }
}


